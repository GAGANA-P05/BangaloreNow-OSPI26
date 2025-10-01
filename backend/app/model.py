from sqlalchemy.orm import DeclarativeBase, relationship, Mapped, mapped_column
from sqlalchemy import Integer, String, DateTime, Float, ForeignKey, URL , Text
from typing import Optional, List
from datetime import datetime

class Base(DeclarativeBase):
    pass

class Event(Base):
    __tablename__ = "events"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement="auto")
    name: Mapped[str] = mapped_column(String)  # Required
    description: Mapped[Optional[str]] = mapped_column(Text)
    url: Mapped[Optional[str]] = mapped_column(Text)  # Made optional
    image: Mapped[Optional[str]] = mapped_column(Text)  # Made optional
    startDate: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))  # Made optional
    endDate: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))  # Made optional
    venue: Mapped[Optional[str]] = mapped_column(String)  # Made optional
    address: Mapped[Optional[str]] = mapped_column(Text)  # Made optional
    lat: Mapped[float] = mapped_column(Float)  # Required
    long: Mapped[float] = mapped_column(Float)  # Required
    organizer: Mapped[Optional[str]] = mapped_column(String)  # Made optional