"""
LexGuard AI — Supabase Client
Wrapper for Supabase database + storage operations.
"""

from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

# Initialize Supabase client with service role key (server-side only)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


async def insert_document(data: dict) -> dict:
    """Insert a document record into Supabase."""
    response = supabase.table("documents").insert(data).execute()
    return response.data[0] if response.data else {}


async def insert_risk_analysis(data: dict) -> dict:
    """Insert a risk analysis record."""
    response = supabase.table("risk_analyses").insert(data).execute()
    return response.data[0] if response.data else {}


async def insert_risk_clauses(clauses: list[dict]) -> list[dict]:
    """Bulk insert flagged clauses."""
    response = supabase.table("risk_clauses").insert(clauses).execute()
    return response.data if response.data else []


async def get_document(document_id: str) -> dict:
    """Fetch document by ID."""
    response = supabase.table("documents").select("*").eq("id", document_id).execute()
    return response.data[0] if response.data else {}


async def get_analysis(document_id: str) -> dict:
    """Fetch latest risk analysis for a document."""
    response = (
        supabase.table("risk_analyses")
        .select("*, risk_clauses(*)")
        .eq("document_id", document_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else {}


async def upload_file_to_storage(bucket: str, file_path: str, file_bytes: bytes) -> str:
    """Upload a file to Supabase Storage. Returns public URL."""
    response = supabase.storage.from_(bucket).upload(file_path, file_bytes)
    public_url = supabase.storage.from_(bucket).get_public_url(file_path)
    return public_url
