from typing import List

from fastapi import APIRouter, HTTPException, status

from app import content, store
from app.schemas import (
    Article, CareerRole, ContactQuestion, ContactSubmissionIn, Created, FaqItem,
    PollVoteIn, ProcessStep, Service,
)

router = APIRouter()


@router.get("/services", response_model=List[Service], tags=["Content"])
def list_services():
    return content.SERVICES


@router.get("/services/{position}", response_model=Service, tags=["Content"])
def get_service(position: int):
    if not 1 <= position <= len(content.SERVICES):
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Service {position} not found")
    return content.SERVICES[position - 1]


@router.get("/process-steps", response_model=List[ProcessStep], tags=["Content"])
def list_process_steps():
    return content.PROCESS_STEPS


@router.get("/articles", response_model=List[Article], tags=["Content"])
def list_articles(filter: str = "all"):
    if filter == "all":
        return content.ARTICLES
    return [a for a in content.ARTICLES if a["filter_key"] == filter]


@router.get("/faq", response_model=List[FaqItem], tags=["Content"])
def list_faq():
    return content.FAQ


@router.get("/career-roles", response_model=List[CareerRole], tags=["Content"])
def list_career_roles():
    return content.CAREER_ROLES


@router.get("/contact-questions", response_model=List[ContactQuestion], tags=["Content"])
def list_contact_questions():
    return content.CONTACT_QUESTIONS


@router.post("/contact-submissions", response_model=Created, status_code=status.HTTP_201_CREATED, tags=["Submissions"])
def create_contact_submission(body: ContactSubmissionIn):
    rec = store.save_contact_submission(body.model_dump())
    return {"id": rec["id"], "created_at": rec["created_at"]}


@router.post("/poll-votes", response_model=Created, status_code=status.HTTP_201_CREATED, tags=["Submissions"])
def create_poll_vote(body: PollVoteIn):
    rec = store.save_poll_vote(content.ARTICLES[body.option_index]["id"])
    return {"id": rec["id"], "created_at": rec["created_at"]}
