"""
LexGuard AI — Negotiation API
Generates redline suggestions and negotiation strategies.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from services.negotiation_engine import NegotiationEngine

router = APIRouter()


class RedlineRequest(BaseModel):
    document_id: str
    concerns: List[str]


@router.post("/redlines")
async def generate_redlines(request: RedlineRequest):
    """
    Generate redline suggestions for buyer concerns.
    
    Example concerns:
      - "Indemnity cap too low"
      - "MAC clause definition too vague"
      - "No carve-out for fraud"
      - "IP assignment incomplete"
    
    Returns redline recommendations with original/proposed text.
    """
    redlines = await NegotiationEngine.generate_redlines(
        document_id=request.document_id,
        concerns=request.concerns,
    )
    return {"redlines": redlines}


class FeasibilityRequest(BaseModel):
    overall_risk_score: int
    deal_breakers: List[dict]


@router.post("/feasibility")
async def assess_deal_feasibility(request: FeasibilityRequest):
    """
    Executive assessment: is this deal salvageable?
    Returns verdict + color-coded recommendation.
    """
    assessment = NegotiationEngine.estimate_deal_feasibility(
        overall_risk_score=request.overall_risk_score,
        deal_breakers=request.deal_breakers,
    )
    return assessment


@router.post("/priorities")
async def prioritize_negotiations(flagged_clauses: List[dict]):
    """
    Sort flagged clauses by negotiation priority (high → medium → low).
    """
    priorities = NegotiationEngine.suggest_negotiation_priorities(flagged_clauses)
    return {"priorities": priorities}
