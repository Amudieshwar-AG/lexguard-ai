"""
LexGuard AI — FastAPI Application Entry Point
Run with: uvicorn main:app --reload --port 8000
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import API_PREFIX, CORS_ORIGINS, UPLOAD_DIR, REPORTS_DIR
from api.upload import router as upload_router
from api.analysis import router as analysis_router
from api.reports import router as reports_router
from api.negotiation import router as negotiation_router
from api.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle — create required directories."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)
    print("[OK] LexGuard AI backend started")
    yield
    print("[SHUTDOWN] LexGuard AI backend shutting down")


app = FastAPI(
    title="LexGuard AI",
    description="AI-driven legal due diligence backend for business acquisition",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS (allow React dev server + Vercel) ────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Route Registration ─────────────────────────────────────────────────────
app.include_router(upload_router,      prefix=f"{API_PREFIX}/documents",    tags=["Documents"])
app.include_router(analysis_router,    prefix=f"{API_PREFIX}/analysis",     tags=["Analysis"])
app.include_router(reports_router,     prefix=f"{API_PREFIX}/reports",      tags=["Reports"])
app.include_router(negotiation_router, prefix=f"{API_PREFIX}/negotiation",  tags=["Negotiation"])
app.include_router(chat_router,        prefix=f"{API_PREFIX}/chat",         tags=["Chat"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "LexGuard AI"}
