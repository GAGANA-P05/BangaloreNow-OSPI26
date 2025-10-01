from pydantic import BaseModel, ConfigDict
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Float, ForeignKey, URL , Text


class EventBase(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    
    id:int
    lat:float 
    long:float 

class EventDetails(EventBase):
    model_config=ConfigDict(from_attributes=True)
    
    name:str
    description:str |None
    startDate:datetime|None
    endDate:datetime | None
    url:str |None 
    image:str | None
    venue:str |None
    address:str | None
    organizer:str | None  
    
    # keyword_names:list[str]

