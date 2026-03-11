"""
LexGuard AI — Embeddings
Converts text chunks into vectors using Google's text-embedding-004.
Used for semantic search in the RAG pipeline.
"""

import asyncio
import numpy as np
import google.generativeai as genai
from config import GEMINI_API_KEY, EMBEDDING_MODEL

genai.configure(api_key=GEMINI_API_KEY)


async def embed_text(text: str) -> list[float]:
    """
    Embed a single string. Returns a 768-dimensional vector.
    Used for query embedding at retrieval time.
    """
    result = await asyncio.to_thread(
        genai.embed_content,
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]


async def embed_documents(texts: list[str]) -> list[list[float]]:
    """
    Batch embed a list of text chunks (document side).
    task_type="retrieval_document" optimizes for storage/retrieval.
    Processes in batches of 20 to respect API rate limits.
    """
    embeddings: list[list[float]] = []
    batch_size = 20

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        tasks = [
            asyncio.to_thread(
                genai.embed_content,
                model=EMBEDDING_MODEL,
                content=chunk,
                task_type="retrieval_document",
            )
            for chunk in batch
        ]
        results = await asyncio.gather(*tasks)
        for res in results:
            embeddings.append(res["embedding"])

    return embeddings


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two embedding vectors."""
    va = np.array(a)
    vb = np.array(b)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)
