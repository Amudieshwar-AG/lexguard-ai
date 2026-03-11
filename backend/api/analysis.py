"""
LexGuard AI — Risk Analysis API
Triggers AI risk analysis on uploaded documents.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.risk_engine import RiskEngine
from services.document_processor import DocumentProcessor
from config import UPLOAD_DIR
import os

router = APIRouter()


class AnalysisRequest(BaseModel):
    document_id: str
    document_type: str = "other"


@router.post("/analyze")
async def analyze_document(request: AnalysisRequest):
    """
    Run full AI risk analysis on a document.
    
    Returns:
      {
        "overall_risk_score": 0-100,
        "risk_level": "low" | "medium" | "high",
        "ai_summary": "...",
        "flagged_clauses": [...],
        "deal_breakers": [...],
        "confidence_score": 0-100
      }
    """
    # Verify uploaded file exists
    file_path = None
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(request.document_id):
            file_path = os.path.join(UPLOAD_DIR, filename)
            break

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document not found. Please upload the document first.")

    # Run risk analysis (uses FAISS RAG index built during upload)
    analysis = await RiskEngine.analyze_document(
        document_id=request.document_id,
        document_type=request.document_type,
        full_text="",  # full_text unused; RAG retrieval handles context
    )

    # Calculate confidence
    confidence = RiskEngine.calculate_confidence(analysis)
    analysis["confidence_score"] = confidence

    return analysis


@router.get("/analysis/{document_id}")
async def get_analysis(document_id: str):
    """Retrieve stored analysis results from Supabase (stub)."""
    # In production: query `risk_analyses` + `risk_clauses` tables
    return {"message": "Fetch from Supabase", "document_id": document_id}
