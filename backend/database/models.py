"""
LexGuard AI — Database Models
Supabase table schemas (PostgreSQL).
Use these to sync with your existing Supabase tables.
"""

from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class Document(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_type: str
    file_size: int
    storage_path: str
    document_type: Optional[str] = "other"
    page_count: Optional[int] = None
    clause_count: Optional[int] = None
    created_at: datetime


class RiskAnalysis(BaseModel):
    id: str
    document_id: str
    user_id: str
    overall_risk_score: int
    risk_level: str  # "low" | "medium" | "high"
    ai_summary: Optional[str] = None
    confidence_score: Optional[int] = None
    status: str  # "pending" | "in_progress" | "completed" | "failed"
    analyzed_at: Optional[datetime] = None
    created_at: datetime


class RiskClause(BaseModel):
    id: str
    risk_analysis_id: str
    clause_reference: str
    clause_title: str
    risk_level: str  # "low" | "medium" | "high"
    description: str
    recommendation: Optional[str] = None
    created_at: datetime


class Report(BaseModel):
    id: str
    document_id: str
    user_id: str
    report_type: str  # "full_due_diligence" | "executive_summary"
    file_path: str
    format: str  # "pdf" | "docx"
    status: str  # "pending" | "generating" | "completed"
    created_at: datetime


class ChatMessage(BaseModel):
    id: str
    document_id: str
    user_id: str
    role: str  # "user" | "assistant"
    message: str
    created_at: datetime


# ─── SQL Schemas (for reference) ────────────────────────────────────────────

DOCUMENTS_TABLE_SQL = """
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    document_type TEXT DEFAULT 'other',
    page_count INT,
    clause_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

RISK_ANALYSES_TABLE_SQL = """
CREATE TABLE risk_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_risk_score INT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    ai_summary TEXT,
    confidence_score INT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

RISK_CLAUSES_TABLE_SQL = """
CREATE TABLE risk_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_analysis_id UUID NOT NULL REFERENCES risk_analyses(id) ON DELETE CASCADE,
    clause_reference TEXT NOT NULL,
    clause_title TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    description TEXT NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

REPORTS_TABLE_SQL = """
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    format TEXT DEFAULT 'pdf',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

CHAT_MESSAGES_TABLE_SQL = """
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""
