"""
Custodia PII Engine — HTTP wrapper for text classification (OpenAI Privacy Filter taxonomy).

Default deployment uses lightweight regex heuristics so the stack runs without multi‑GB ML deps.
Set USE_PRIVACY_FILTER_MODEL=1 and install torch+transformers in the image to load `openai/privacy-filter`.
"""
from __future__ import annotations

import os
import re
from typing import Any, Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

OperatingPoint = Literal["balanced", "high_recall", "high_precision"]

LABELS = frozenset(
    {
        "account_number",
        "private_address",
        "private_email",
        "private_person",
        "private_phone",
        "private_url",
        "private_date",
        "secret",
    }
)


class ClassifyRequest(BaseModel):
    texts: list[str] = Field(default_factory=list, max_length=64)
    operating_point: OperatingPoint = "balanced"


class Span(BaseModel):
    label: str
    score: float
    start: int
    end: int


class ClassifyItem(BaseModel):
    spans: list[Span]


class ClassifyResponse(BaseModel):
    items: list[ClassifyItem]


def _heuristic_spans(text: str) -> list[Span]:
    spans: list[Span] = []
    for m in re.finditer(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text):
        spans.append(Span(label="private_email", score=0.92, start=m.start(), end=m.end()))
    for m in re.finditer(r"\b\+?\d[\d\s().-]{8,}\b", text):
        spans.append(Span(label="private_phone", score=0.75, start=m.start(), end=m.end()))
    for m in re.finditer(r"\b(?:https?://|www\.)\S+", text):
        spans.append(Span(label="private_url", score=0.8, start=m.start(), end=m.end()))
    return spans


_pipeline: Any = None


def _load_transformers_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline
    if os.environ.get("USE_PRIVACY_FILTER_MODEL", "").lower() not in ("1", "true", "yes"):
        return None
    try:
        from transformers import pipeline  # type: ignore

        _pipeline = pipeline(
            task="token-classification",
            model="openai/privacy-filter",
            aggregation_strategy="simple",
        )
        return _pipeline
    except Exception:
        return None


def _classify_with_model(text: str) -> list[Span]:
    pipe = _load_transformers_pipeline()
    if pipe is None:
        return _heuristic_spans(text)
    out = pipe(text)
    spans: list[Span] = []
    if not isinstance(out, list):
        return spans
    for ent in out:
        if not isinstance(ent, dict):
            continue
        label = str(ent.get("entity_group", "")).lower()
        if label not in LABELS:
            continue
        word = str(ent.get("word", ""))
        start = int(text.find(word)) if word else 0
        end = start + len(word) if word else len(text)
        score = float(ent.get("score", 0.9))
        spans.append(Span(label=label, score=score, start=max(0, start), end=min(len(text), end)))
    return spans or _heuristic_spans(text)


app = FastAPI(title="Custodia PII Engine", version="0.1.0")


@app.get("/health")
def health():
    mode = (
        "transformers"
        if os.environ.get("USE_PRIVACY_FILTER_MODEL", "").lower() in ("1", "true", "yes")
        else "heuristic"
    )
    return {"ok": True, "model_mode": mode}


@app.post("/classify", response_model=ClassifyResponse)
def classify(body: ClassifyRequest):
    items: list[ClassifyItem] = []
    for text in body.texts:
        spans = _classify_with_model(text)
        items.append(ClassifyItem(spans=spans))
    return ClassifyResponse(items=items)
