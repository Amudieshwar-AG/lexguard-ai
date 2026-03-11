"""
LexGuard AI — Central Configuration
All env vars, model names, and constants live here. Never hardcode credentials elsewhere.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ─── Gemini / Google AI ─────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = "models/gemini-2.5-flash"       # main reasoning model
GEMINI_FLASH_MODEL: str = "models/gemini-2.0-flash-lite"  # fast model for simple tasks
EMBEDDING_MODEL: str = "models/gemini-embedding-001"

# ─── Supabase ──────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")  # server-side only
SUPABASE_STORAGE_BUCKET: str = "documents"

# ─── FastAPI ───────────────────────────────────────────────────────────────
API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
API_PORT: int = int(os.getenv("API_PORT", "8000"))
API_PREFIX: str = "/api/v1"
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:8080"
).split(",")

# ─── File Processing ───────────────────────────────────────────────────────
UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "data", "uploaded_docs")
REPORTS_DIR: str = os.path.join(os.path.dirname(__file__), "reports", "generated_reports")
MAX_FILE_SIZE_MB: int = 50
ALLOWED_EXTENSIONS: set[str] = {".pdf", ".docx", ".doc"}

# ─── Vector Store ──────────────────────────────────────────────────────────
VECTOR_STORE_DIR: str = os.path.join(os.path.dirname(__file__), "vector_store", "faiss_index")
EMBEDDING_DIMENSION: int = 768        # text-embedding-004 output size
CHUNK_SIZE: int = 800                  # characters per text chunk
CHUNK_OVERLAP: int = 150              # overlap to preserve clause context

# ─── RAG / Retrieval ───────────────────────────────────────────────────────
TOP_K_CHUNKS: int = 8                  # chunks retrieved per query
MIN_SIMILARITY_SCORE: float = 0.65    # cosine similarity threshold

# ─── Risk Scoring ──────────────────────────────────────────────────────────
RISK_THRESHOLDS: dict[str, int] = {
    "low":    40,    # 0–40  = low risk
    "medium": 70,    # 41–70 = medium risk
    "high":   100,   # 71–100 = high risk
}

# ─── Document Categories (M&A specific) ────────────────────────────────────
DOCUMENT_TYPES: list[str] = [
    "share_purchase_agreement",
    "shareholder_agreement",
    "financial_statement",
    "regulatory_filing",
    "nda",
    "employment_agreement",
    "ip_assignment",
    "other",
]
