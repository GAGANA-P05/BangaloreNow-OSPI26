from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from datetime import datetime, timedelta, timezone
from app.model import Event
from app.schemas import EventBase, EventDetails

def get_all_events(session: Session) -> list[EventBase]:
    """Get all events with their coordinates - only requires name, lat, long to be non-null"""
    # Get current date in UTC timezone to match timestamptz
    today = datetime.now(timezone.utc).date()
    end_date = today + timedelta(days=4)
    
    # Use a subquery to get distinct event names with their minimum ID (consistent selection)
    distinct_events_subquery = session.execute(
        select(func.min(Event.id).label('id'))
        .group_by(Event.name)
        # More flexible date filtering - include events with null dates or within range
        .where(
            # Include events with null startDate OR events within date range
            (Event.startDate.is_(None)) | 
            (func.date(Event.startDate) >= today) & (func.date(Event.startDate) <= end_date),
            # Only require essential fields to be non-null
            Event.lat.is_not(None),
            Event.long.is_not(None),
            Event.name.is_not(None)
        )
    ).scalars().all()
    
    # Get the full event data for these distinct IDs
    result = session.execute(
        select(Event.id, Event.lat, Event.long)
        .where(Event.id.in_(distinct_events_subquery))
    ).mappings().all()
    
    return [EventBase(**row) for row in result]
    

def get_event_detail(session: Session, event_id: int) -> EventDetails | None:
    """Get detailed event information by ID, with better null value handling"""
    
    result = session.execute(
        select(
            Event.id,
            Event.name,
            Event.description,
            Event.url,
            Event.image,
            Event.startDate,
            Event.endDate,
            Event.venue,
            Event.address,
            Event.lat,
            Event.long,
            Event.organizer,
        )
        .where(
            Event.id == event_id,
            # Only require that the event has coordinates and name
            Event.lat.is_not(None),
            Event.long.is_not(None),
            Event.name.is_not(None)
            # Removed date filtering - let frontend handle display of past events
        )
    ).mappings().first()
    
    if result is None:
        return None
    
    # Convert result to dict and handle potential None values gracefully
    event_data = dict(result)
    
    # Ensure essential fields exist, set others to None if missing
    if not all([event_data.get('id'), event_data.get('lat'), event_data.get('long'), event_data.get('name')]):
        return None
    
    return EventDetails(**event_data)

# def get_filtered_events(session: Session, keyword_filter: str = "festival"):
#     """Get events filtered by keyword"""
#     result = session.execute(
#         select(Event)
#         .join(Event.keywords)
#         .filter(Keyword.name == keyword_filter)
#         .options(joinedload(Event.keywords))
#     )
#     return result.scalars().unique().all()
