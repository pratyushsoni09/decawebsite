import json

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from main import app


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DATA_DIR", tmp_path)
    return TestClient(app)


def read_jsonl(path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]


def test_health(client):
    assert client.get("/health").json()["status"] == "healthy"


@pytest.mark.parametrize("path,count", [
    ("/api/services", 7), ("/api/process-steps", 6), ("/api/articles", 2),
    ("/api/faq", 4), ("/api/career-roles", 4), ("/api/contact-questions", 6),
])
def test_content_lists(client, path, count):
    r = client.get(path)
    assert r.status_code == 200
    assert len(r.json()) == count


def test_content_is_verbatim(client):
    s = client.get("/api/services/4").json()
    assert s["name"] == "CRM Systems"
    assert s["overview"].startswith("CRMs as the “central nervous system”")  # curly quotes kept
    assert client.get("/api/process-steps").json()[0]["name"] == "Idea"
    assert client.get("/api/career-roles").json()[2]["apply_href"] == \
        "mailto:careers@decacorpus.com?subject=Interest%20in%20Strategy%20and%20delivery"


def test_service_out_of_range(client):
    assert client.get("/api/services/0").status_code == 404
    assert client.get("/api/services/8").status_code == 404


def test_article_filter(client):
    assert [a["filter_key"] for a in client.get("/api/articles?filter=ai").json()] == ["ai"]


def test_contact_submission_round_trip(client, tmp_path):
    body = {"name": "Ada", "email": "ada@example.com", "company": "", "project": "Website", "timeline": "", "notes": ""}
    r = client.post("/api/contact-submissions", json=body)
    assert r.status_code == 201
    rows = read_jsonl(tmp_path / "contact_submissions.jsonl")
    assert rows[0]["name"] == "Ada" and rows[0]["id"] == r.json()["id"]


def test_contact_accepts_empty_answers(client):
    # The prototype has no validation; an all-empty submission is valid.
    assert client.post("/api/contact-submissions", json={}).status_code == 201


def test_poll_vote(client, tmp_path):
    assert client.post("/api/poll-votes", json={"option_index": 1}).status_code == 201
    assert read_jsonl(tmp_path / "poll_votes.jsonl")[0]["article_id"] == 2


@pytest.mark.parametrize("bad", [{"option_index": 2}, {"option_index": -1}, {}])
def test_poll_vote_rejects_invalid(client, bad):
    assert client.post("/api/poll-votes", json=bad).status_code == 422
