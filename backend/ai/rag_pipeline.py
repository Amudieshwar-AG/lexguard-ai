"""
LexGuard AI — RAG Pipeline (Retrieval-Augmented Generation)

Flow:
  1. At upload time: chunk document → embed chunks → store in FAISS
  2. At query time: embed query → find top-k similar chunks → send to Gemini

This means Gemini always has exact clause text as context, preventing hallucination.
"""

import os
import json
import pickle
import numpy as np
import faiss

from config import (
    VECTOR_STORE_DIR,
    EMBEDDING_DIMENSION,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    TOP_K_CHUNKS,
    MIN_SIMILARITY_SCORE,
)
from ai.embeddings import embed_text, embed_documents


# ─── In-memory metadata store (maps FAISS index position → chunk metadata) ──
# In production you'd persist this to Supabase or Redis.
_metadata_store: dict[str, list[dict]] = {}
_faiss_indexes: dict[str, faiss.IndexFlatIP] = {}


def _index_path(document_id: str) -> str:
    return os.path.join(VECTOR_STORE_DIR, f"{document_id}.faiss")


def _meta_path(document_id: str) -> str:
    return os.path.join(VECTOR_STORE_DIR, f"{document_id}.meta.pkl")


def _load_index(document_id: str) -> tuple[faiss.IndexFlatIP | None, list[dict]]:
    """Load FAISS index and metadata from disk."""
    idx_path = _index_path(document_id)
    meta_path = _meta_path(document_id)

    if not os.path.exists(idx_path):
        return None, []

    index = faiss.read_index(idx_path)
    with open(meta_path, "rb") as f:
        metadata = pickle.load(f)

    return index, metadata


async def index_document(document_id: str, chunks: list[str]) -> None:
    """
    Embed all chunks and save to FAISS for this document.
    Called once after document processing.
    """
    os.makedirs(VECTOR_STORE_DIR, exist_ok=True)

    embeddings = await embed_documents(chunks)
    vectors = np.array(embeddings, dtype=np.float32)

    # Normalize for cosine similarity (Inner Product on unit vectors = cosine)
    faiss.normalize_L2(vectors)

    index = faiss.IndexFlatIP(EMBEDDING_DIMENSION)
    index.add(vectors)

    metadata = [
        {"document_id": document_id, "chunk_index": i, "text": chunk}
        for i, chunk in enumerate(chunks)
    ]

    faiss.write_index(index, _index_path(document_id))
    with open(_meta_path(document_id), "wb") as f:
        pickle.dump(metadata, f)

    _faiss_indexes[document_id] = index
    _metadata_store[document_id] = metadata


async def retrieve_relevant_chunks(
    document_id: str,
    query: str,
    top_k: int = TOP_K_CHUNKS,
) -> list[dict]:
    """
    Given a natural language query, return the most semantically relevant
    document chunks. Each result: {"text": str, "score": float, "chunk_index": int}
    """
    index, metadata = _faiss_indexes.get(document_id), _metadata_store.get(document_id)

    if index is None:
        index, metadata = _load_index(document_id)
        if index is None:
            return []
        _faiss_indexes[document_id] = index
        _metadata_store[document_id] = metadata

    query_vec = np.array([await embed_text(query)], dtype=np.float32)
    faiss.normalize_L2(query_vec)

    scores, indices = index.search(query_vec, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1 or score < MIN_SIMILARITY_SCORE:
            continue
        results.append({
            "text": metadata[idx]["text"],
            "score": float(score),
            "chunk_index": int(idx),
        })

    return results


def build_context_prompt(chunks: list[dict], query: str) -> str:
    """
    Assemble the RAG context block that gets inserted into every Gemini prompt.
    The model sees exact clause text, not summaries, preventing hallucination.
    """
    context_blocks = "\n\n---\n\n".join(
        f"[Clause {i+1} — relevance {c['score']:.2f}]\n{c['text']}"
        for i, c in enumerate(chunks)
    )
    return (
        f"DOCUMENT CONTEXT (use only this text for your analysis):\n\n"
        f"{context_blocks}\n\n"
        f"TASK: {query}"
    )
