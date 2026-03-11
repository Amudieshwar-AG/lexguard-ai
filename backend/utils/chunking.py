"""
LexGuard AI — Text Chunking Utilities
Intelligent text splitting for vector indexing.
"""

from typing import List


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """
    Split text into overlapping chunks.
    Overlap preserves context across chunk boundaries (important for legal clauses).
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        # Try to break at sentence boundary
        if end < len(text):
            # Look for period, newline, or semicolon near the end
            for punct in [".\n", ". ", ";\n", "; "]:
                idx = text.rfind(punct, start, end)
                if idx != -1:
                    end = idx + len(punct)
                    break

        chunks.append(text[start:end].strip())
        start = end - overlap if end < len(text) else end

    return chunks


def clean_text(text: str) -> str:
    """
    Clean extracted text:
      - Remove excessive whitespace
      - Normalize line breaks
      - Strip control characters
    """
    # Collapse multiple spaces
    text = " ".join(text.split())

    # Normalize line breaks
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove control chars except newlines
    text = "".join(c for c in text if c.isprintable() or c == "\n")

    return text.strip()


def extract_section_number(text: str) -> str:
    """
    Extract section number from clause text.
    Examples: "7.2", "Section 12.3", "Article IV"
    """
    import re

    patterns = [
        r"(?:Section|Clause|Article)\s+(\d+(?:\.\d+)*)",
        r"^(\d+(?:\.\d+)*)\s*[-–—:]",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(1)

    return "Unknown"
