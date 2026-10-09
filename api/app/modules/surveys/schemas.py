from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, StrictInt


class SurveyStatus(BaseModel):
    state: Literal["pending", "answered", "expired"]
    folio: str
    title: str
    question: str
    rating: int | None
    has_comment: bool
    questions: list[dict] = Field(default_factory=list)
    ratings: dict[str, int] = Field(default_factory=dict)


class RatingIn(BaseModel):
    rating: StrictInt | None = Field(default=None, ge=1, le=5)
    ratings: dict[str, StrictInt] | None = None


class CommentIn(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)


class SurveyOut(BaseModel):
    sent_at: datetime
    expires_at: datetime
    rating: int | None
    comment: str
    answered_at: datetime | None
    questions: list[dict] = Field(default_factory=list)
    ratings: dict[str, int] = Field(default_factory=dict)
