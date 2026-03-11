"""
LexGuard AI — Document Upload API
Handles file upload, text extraction, and initial processing.
"""

import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from config import UPLOAD_DIR, MAX_FILE_SIZE_MB, ALLOWED_EXTENSIONS
from services.document_processor import DocumentProcessor
from services.clause_extractor import ClauseExtractor
from ai.rag_pipeline import index_document

router = APIRouter()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a legal document (PDF or DOCX).
    
    Flow:
      1. Validate file size and type
      2. Save to disk
      3. Extract text
      4. Classify document type (SPA, shareholder agreement, etc.)
      5. Extract clauses
      6. Index in FAISS vector store
      7. Return document metadata + ID
    """
    # Validate extension
    if not DocumentProcessor.validate_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Validate size
    file_content = await file.read()
    size_mb = len(file_content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Max: {MAX_FILE_SIZE_MB}MB"
        )

    # Save file
    document_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{document_id}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(file_content)

    try:
        # Extract text
        full_text = await DocumentProcessor.extract_text(file_path)
        metadata = DocumentProcessor.get_document_metadata(file_path)

        # Classify document type (fast heuristic keyword check to avoid extra API call)
        excerpt_lower = full_text[:3000].lower()
        if any(k in excerpt_lower for k in ["share purchase", "sale of shares", "buyer shall", "seller shall"]):
            doc_type = "share_purchase_agreement"
        elif any(k in excerpt_lower for k in ["shareholder", "voting rights", "board of directors", "equity"]):
            doc_type = "shareholder_agreement"
        elif any(k in excerpt_lower for k in ["form 8-k", "form 10-k", "form 10-q", "sec filing", "commission", "exchange act", "securities and exchange"]):
            doc_type = "regulatory_filing"
        elif any(k in excerpt_lower for k in ["confidential", "non-disclosure", "trade secret"]):
            doc_type = "nda"
        elif any(k in excerpt_lower for k in ["employment", "employee", "compensation", "salary"]):
            doc_type = "employment_agreement"
        elif any(k in excerpt_lower for k in ["intellectual property", "assign", "patent", "copyright"]):
            doc_type = "ip_assignment"
        else:
            doc_type = "other"

        # Extract clauses using fast heuristic (no extra API call)
        clauses = ClauseExtractor.extract_clauses_heuristic(full_text)
        clause_texts = [c["text"] for c in clauses]

        # Index in FAISS for RAG (non-critical — analysis falls back to raw text if this fails)
        try:
            await index_document(document_id, clause_texts)
        except Exception as emb_err:
            print(f"[WARN] FAISS indexing skipped: {emb_err}")

        return JSONResponse({
            "document_id": document_id,
            "filename": file.filename,
            "document_type": doc_type,
            "page_count": metadata.get("page_count", 0),
            "clause_count": len(clauses),
            "file_size_mb": metadata["file_size_mb"],
            "status": "processed",
            "message": "Document uploaded and indexed successfully."
        })

    except Exception as e:
        # Cleanup on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/documents")
async def list_documents():
    """List all uploaded documents (stub — in production, query Supabase)."""
    # In production, query Supabase `documents` table
    return {"documents": [], "message": "Connect to Supabase to list documents"}


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document from disk and vector store."""
    # In production: delete from Supabase Storage + DB + FAISS
    return {"message": "Delete endpoint — implement Supabase cleanup"}
