"""
LexGuard AI — Report Generation API
Builds PDF reports from risk analysis results.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Dict
import io

from services.report_generator import ReportGenerator
from config import REPORTS_DIR
import os

router = APIRouter()


class ReportRequest(BaseModel):
    document_name: str
    analysis: Dict
    document_metadata: Dict = {}
    report_type: str = "full"  # "full" or "summary"


@router.post("/generate")
async def generate_report(request: ReportRequest):
    """
    Generate a PDF report (full or executive summary).
    
    Returns:
      {
        "report_id": "...",
        "filename": "...",
        "file_path": "...",
        "report_type": "full" | "summary"
      }
    """
    try:
        if request.report_type == "summary":
            filepath = ReportGenerator.generate_executive_summary(
                document_name=request.document_name,
                analysis=request.analysis,
            )
        else:
            filepath = ReportGenerator.generate_full_report(
                document_name=request.document_name,
                analysis=request.analysis,
                document_metadata=request.document_metadata,
            )

        filename = os.path.basename(filepath)
        return {
            "report_id": filename.replace(".pdf", ""),
            "filename": filename,
            "file_path": filepath,
            "report_type": request.report_type,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.post("/stream")
async def stream_report(request: ReportRequest):
    """
    Generate a PDF report and return it directly as a binary stream.
    No file is stored on disk — safe for ephemeral deployments (Render free tier).
    """
    try:
        if request.report_type == "summary":
            pdf_bytes = ReportGenerator.generate_executive_summary_bytes(
                document_name=request.document_name,
                analysis=request.analysis,
            )
            filename = f"LexGuard_Summary_{request.document_name}.pdf"
        else:
            pdf_bytes = ReportGenerator.generate_full_report_bytes(
                document_name=request.document_name,
                analysis=request.analysis,
                document_metadata=request.document_metadata,
            )
            filename = f"LexGuard_Report_{request.document_name}.pdf"

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report streaming failed: {str(e)}")


@router.get("/download/{filename}")
async def download_report(filename: str):
    """
    Download a generated PDF report.
    """
    filepath = os.path.join(REPORTS_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        filename=filename,
    )


@router.get("/list")
async def list_reports():
    """List all generated reports."""
    if not os.path.exists(REPORTS_DIR):
        return {"reports": []}

    files = [
        {
            "filename": f,
            "created_at": os.path.getctime(os.path.join(REPORTS_DIR, f)),
            "size_mb": round(os.path.getsize(os.path.join(REPORTS_DIR, f)) / (1024 * 1024), 2),
        }
        for f in os.listdir(REPORTS_DIR)
        if f.endswith(".pdf")
    ]

    # Sort by creation time (newest first)
    files.sort(key=lambda x: x["created_at"], reverse=True)

    return {"reports": files}
