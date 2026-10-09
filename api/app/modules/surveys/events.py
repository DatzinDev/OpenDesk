from dataclasses import dataclass


@dataclass(frozen=True)
class SurveyAnswered:
    ticket_id: int
    rating: int
