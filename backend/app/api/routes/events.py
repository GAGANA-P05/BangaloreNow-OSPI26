from fastapi import APIRouter, Request, Depends, HTTPException, status
from app.crud import get_all_events, get_event_detail
from sqlalchemy.orm import Session
from app.api.dependecies import get_db
from app.model import Event
from app.schemas import EventBase, EventDetails
router=APIRouter()


#1. endpoint for gettign all markers (no sorting initially by geohashing)
#2. getting detailed info about the event through the eventid
#3. 

@router.get("/get-all-events", response_model=list[EventBase])
async def retrieve_all_events(session:Session=Depends(get_db)):
    """Get all events with coordinates. Includes events with null fields as long as name, lat, long exist."""
    try:
        payload = get_all_events(session)  # type:ignore
        print(f"Retrieved {len(payload)} events with valid coordinates")
        return payload
    
    except Exception as e:
        print(f"Error retrieving all events: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving events: {str(e)}"
        )

@router.get("/get-event-details/{event_id}", response_model=EventDetails)
async def retrieve_event_detail(event_id:int, session:Session=Depends(get_db) ):
    """Get event details by ID. Returns events with null fields as long as name, lat, long exist."""
    try:
        payload = get_event_detail(session=session, event_id=event_id)
        
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Event with ID {event_id} not found or missing required fields (name, lat, long)"
            )
        
        return payload
    
    except Exception as e:
        # Log the error for debugging
        print(f"Error retrieving event {event_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving event details: {str(e)}"
        )