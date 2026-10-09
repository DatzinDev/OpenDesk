from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SurveyStatus(BaseModel):
    state: Literal["pending", "answered", "expired"]
    folio: str
    title: str
    question: str
    rating: int | None
    has_comment: bool


class RatingIn(BaseModel):
    rating: int = Field(ge=1, le=5)


class CommentIn(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)


class SurveyOut(BaseModel):
    sent_at: datetime
    expires_at: datetime
    rating: int | None
    comment: str
    answered_at: datetime | None
