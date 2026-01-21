from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class TranscribeResponse(BaseModel):
    transcript: str
    language: Literal["he", "en"]


class MeetingSummaryRequest(BaseModel):
    transcript: str = Field(min_length=1)
    language: Optional[Literal["he", "en"]] = None


class MeetingSummaryResponse(BaseModel):
    summary: str
    participants: List[str]
    decisions: List[str]
    actionItems: List[str]
    language: Literal["he", "en"]


class ExportDocxRequest(BaseModel):
    transcript: str
    summary: str
    participants: List[str]
    decisions: List[str]
    actionItems: List[str]
    language: Literal["he", "en"]
