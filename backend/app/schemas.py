from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ServiceList(BaseModel):
    list_no: int
    heading: str
    items: List[str]


class Service(BaseModel):
    id: int
    name: str
    short_line: str
    chip_label: str
    overview: str
    lists: List[ServiceList]
    pull_quote: str
    key_features: List[str]
    technologies: List[str]


class ProcessStep(BaseModel):
    id: int
    name: str
    description: str


class Article(BaseModel):
    id: int
    title: str
    meta: str
    excerpt: str
    filter_key: Literal["ai", "design"]
    card_label: str
    image_file: str
    image_alt: str


class FaqItem(BaseModel):
    id: int
    question: str
    answer: str


class CareerRole(BaseModel):
    id: int
    title: str
    description: str
    apply_href: str


class ContactQuestion(BaseModel):
    step: int
    question: str
    label: str
    placeholder: str
    hint: str
    input_type: Literal["text", "email"]


class ContactSubmissionIn(BaseModel):
    # The prototype's wizard has no validation and accepts empty answers, so every field is optional.
    name: Optional[str] = Field(None, max_length=500)
    email: Optional[str] = Field(None, max_length=500)
    company: Optional[str] = Field(None, max_length=500)
    project: Optional[str] = Field(None, max_length=2000)
    timeline: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=5000)


class Created(BaseModel):
    id: str
    created_at: str


class PollVoteIn(BaseModel):
    # The poll's two options are the two articles, in AR order.
    option_index: int = Field(..., ge=0, le=1)
