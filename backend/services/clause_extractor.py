"""
LexGuard AI — Clause Extractor
Splits full document text into semantic chunks (clauses) for embedding and RAG retrieval.
Uses hybrid approach: section-based splitting + semantic chunking.
"""

import re
import json
from typing import List, Dict
from config import CHUNK_SIZE, CHUNK_OVERLAP
from ai.llm_client import generate_fast
from ai.prompts.risk_analysis import CLAUSE_EXTRACTION_PROMPT


class ClauseExtractor:
    """Segment legal documents into clause-level chunks."""

    @staticmethod
    async def extract_clauses_llm(text: str) -> List[Dict]:
        """
        Use Gemini Flash to intelligently parse clauses.
        This is the BEST approach for legal docs where section numbering is inconsistent.
        """
        prompt = CLAUSE_EXTRACTION_PROMPT.format(text=text[:15000])  # limit to 15k chars
        try:
            result = await generate_fast(prompt)
            # Gemini should return JSON array
            clauses = json.loads(result)
            return clauses
        except Exception as e:
            # Fallback to heuristic if LLM fails
            return ClauseExtractor.extract_clauses_heuristic(text)

    @staticmethod
    def extract_clauses_heuristic(text: str) -> List[Dict]:
        """
        Fallback: split by section numbers like "1.2", "7.3", "Article 5", etc.
        Then chunk any sections longer than CHUNK_SIZE.
        """
        # Regex to detect section headers: "1.2 Title" or "Section 7.2 - Title"
        section_pattern = re.compile(
            r'(?:^|\n)(?:Section\s+)?(\d+(?:\.\d+)*)\s*[-–—:]?\s*([A-Z][^\n]{0,80})',
            re.MULTILINE
        )

        matches = list(section_pattern.finditer(text))
        clauses = []

        for i, match in enumerate(matches):
            section_num = match.group(1)
            title = match.group(2).strip()
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            clause_text = text[start:end].strip()

            # If clause is too long, chunk it
            if len(clause_text) > CHUNK_SIZE:
                sub_chunks = ClauseExtractor._split_long_clause(clause_text)
                for idx, chunk in enumerate(sub_chunks):
                    clauses.append({
                        "section": f"{section_num}.{idx}",
                        "title": f"{title} (part {idx + 1})",
                        "text": chunk,
                        "starts_at": start,
                        "ends_at": end,
                    })
            else:
                clauses.append({
                    "section": section_num,
                    "title": title,
                    "text": clause_text,
                    "starts_at": start,
                    "ends_at": end,
                })

        # If no sections found (malformed doc), just split by paragraphs
        if not clauses:
            clauses = ClauseExtractor._paragraph_chunks(text)

        return clauses

    @staticmethod
    def _split_long_clause(text: str) -> List[str]:
        """Split a clause that exceeds CHUNK_SIZE into overlapping chunks."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + CHUNK_SIZE
            chunks.append(text[start:end])
            start += CHUNK_SIZE - CHUNK_OVERLAP
        return chunks

    @staticmethod
    def _paragraph_chunks(text: str) -> List[Dict]:
        """Fallback: split by double newlines (paragraphs)."""
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        clauses = []
        for i, para in enumerate(paragraphs):
            if len(para) > CHUNK_SIZE:
                sub_chunks = ClauseExtractor._split_long_clause(para)
                for sub_idx, chunk in enumerate(sub_chunks):
                    clauses.append({
                        "section": f"P{i}.{sub_idx}",
                        "title": f"Paragraph {i + 1} (part {sub_idx + 1})",
                        "text": chunk,
                        "starts_at": 0,
                        "ends_at": 0,
                    })
            else:
                clauses.append({
                    "section": f"P{i}",
                    "title": f"Paragraph {i + 1}",
                    "text": para,
                    "starts_at": 0,
                    "ends_at": 0,
                })
        return clauses
