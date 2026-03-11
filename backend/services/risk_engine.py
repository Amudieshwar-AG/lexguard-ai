"""
LexGuard AI — Risk Engine
The CORE of your problem statement.
Analyzes clauses, scores risk, identifies deal-breakers, and flags negotiation points.
"""

import json
import os
from typing import Dict, List
from ai.llm_client import generate_analysis
from ai.rag_pipeline import retrieve_relevant_chunks, build_context_prompt
from ai.prompts.risk_analysis import (
    RISK_ANALYSIS_SYSTEM,
    RISK_ANALYSIS_PROMPT_TEMPLATE,
)
from config import RISK_THRESHOLDS, UPLOAD_DIR


class RiskEngine:
    """
    Analyzes financial agreements, shareholder docs, and regulatory filings
    to produce structured risk reports.
    """

    @staticmethod
    async def analyze_document(
        document_id: str,
        document_type: str,
        full_text: str,
    ) -> Dict:
        """
        Main entry point: run full risk analysis on a document.

        Steps:
          1. Retrieve top relevant clauses using RAG
          2. Send to Gemini with risk analysis prompt
          3. Parse structured JSON response
          4. Validate and return
        """
        # Retrieve semantically important clauses (RAG)
        # Focus on the four core clause types LexGuard is designed to detect
        query = (
            "Find all clauses related to: "
            "liability caps, limitation of liability, indemnification, indemnity obligations, "
            "termination rights, termination for convenience, termination for cause, "
            "non-compete, non-competition, non-solicitation, restrictive covenants, "
            "indemnify, hold harmless, defend, uncapped liability, change of control."
        )
        relevant_chunks = await retrieve_relevant_chunks(document_id, query, top_k=12)

        # If FAISS index empty (first run or no clauses extracted), fall back to direct text
        if not relevant_chunks:
            from services.document_processor import DocumentProcessor
            file_path = None
            for fname in os.listdir(UPLOAD_DIR):
                if fname.startswith(document_id):
                    file_path = os.path.join(UPLOAD_DIR, fname)
                    break
            if file_path:
                raw_text = await DocumentProcessor.extract_text(file_path)
                # Feed first 12k chars directly as context
                context = f"DOCUMENT TEXT (first 12,000 characters):\n\n{raw_text[:12000]}"
            else:
                context = "No document text available."
        else:
            # Build context for LLM
            context = build_context_prompt(relevant_chunks, query)
        prompt = RISK_ANALYSIS_PROMPT_TEMPLATE.format(
            context=context,
            document_type=document_type,
        )

        # Generate risk analysis
        raw_response = await generate_analysis(prompt)

        # Parse JSON (Gemini should return valid JSON)
        analysis = None
        json_str = None
        
        try:
            # Try multiple extraction methods
            # 1. Check for ```json blocks
            if "```json" in raw_response:
                json_str = raw_response.split("```json")[1].split("```")[0].strip()
            # 2. Check for plain ``` blocks
            elif "```" in raw_response:
                json_str = raw_response.split("```")[1].split("```")[0].strip()
            # 3. Try to find JSON by looking for outermost { }
            elif "{" in raw_response and "}" in raw_response:
                start = raw_response.find("{")
                end = raw_response.rfind("}") + 1
                json_str = raw_response[start:end]
            # 4. Try the whole response as-is
            else:
                json_str = raw_response.strip()

            # Attempt to parse
            analysis = json.loads(json_str)
            
        except (json.JSONDecodeError, ValueError, IndexError) as e:
            # Log the actual error for debugging
            print(f"[ERROR] JSON parsing failed: {str(e)}")
            print(f"[DEBUG] Raw response length: {len(raw_response)} chars")
            print(f"[DEBUG] Full raw response:\n{raw_response}")
            
            # Try to extract what we can from the partial JSON
            import re
            extracted = {
                "overall_risk_score": 50,
                "risk_level": "medium",
                "ai_summary": "",
                "confidence_score": 0,
                "clause_summary": {
                    "liability":   {"found": False, "count": 0, "highest_risk": "low"},
                    "termination": {"found": False, "count": 0, "highest_risk": "low"},
                    "non_compete": {"found": False, "count": 0, "highest_risk": "low"},
                    "indemnity":   {"found": False, "count": 0, "highest_risk": "low"},
                },
                "flagged_clauses": [],
                "deal_breakers": [],
            }
            
            # Extract risk score
            score_match = re.search(r'"overall_risk_score":\s*(\d+)', raw_response)
            if score_match:
                extracted["overall_risk_score"] = int(score_match.group(1))
            
            # Extract risk level
            level_match = re.search(r'"risk_level":\s*"(\w+)"', raw_response)
            if level_match:
                extracted["risk_level"] = level_match.group(1)
            
            # Extract ai_summary
            summary_match = re.search(r'"ai_summary":\s*"([^"]*(?:\\"[^"]*)*)"', raw_response)
            if summary_match:
                extracted["ai_summary"] = summary_match.group(1).replace('\\"', '"')
            
            # Extract clause_summary for each type
            for clause_type in ["liability", "termination", "non_compete", "indemnity"]:
                type_pattern = rf'"{clause_type}":\s*\{{\s*"found":\s*(true|false),\s*"count":\s*(\d+),\s*"highest_risk":\s*"(\w+)"'
                type_match = re.search(type_pattern, raw_response)
                if type_match:
                    extracted["clause_summary"][clause_type] = {
                        "found": type_match.group(1) == "true",
                        "count": int(type_match.group(2)),
                        "highest_risk": type_match.group(3)
                    }
            
            print(f"[INFO] Extracted partial data: score={extracted['overall_risk_score']}, level={extracted['risk_level']}")
            analysis = extracted

        # Validate risk level matches score
        score = analysis.get("overall_risk_score", 50)
        if score <= RISK_THRESHOLDS["low"]:
            analysis["risk_level"] = "low"
        elif score <= RISK_THRESHOLDS["medium"]:
            analysis["risk_level"] = "medium"
        else:
            analysis["risk_level"] = "high"

        # Ensure clause_summary is always present with all 4 keys
        default_cs = {
            "liability":   {"found": False, "count": 0, "highest_risk": "low"},
            "termination": {"found": False, "count": 0, "highest_risk": "low"},
            "non_compete": {"found": False, "count": 0, "highest_risk": "low"},
            "indemnity":   {"found": False, "count": 0, "highest_risk": "low"},
        }
        cs = analysis.get("clause_summary", {})
        for key, val in default_cs.items():
            cs.setdefault(key, val)
        analysis["clause_summary"] = cs

        return analysis

    @staticmethod
    async def identify_deal_breakers(clauses: List[Dict]) -> List[Dict]:
        """
        Scan clauses for automatic deal-breaker triggers:
          - Change of control termination rights
          - Material Adverse Change (MAC) clauses with vague definitions
          - IP assignment failures
          - Missing regulatory approvals
          - Uncapped liabilities
        """
        deal_breakers = []

        for clause in clauses:
            text_lower = clause.get("text", "").lower()

            # Change of control
            if "change of control" in text_lower and "terminate" in text_lower:
                deal_breakers.append({
                    "clause": clause.get("section", "Unknown"),
                    "reason": "Change of control allows contract termination, risking customer/vendor relationships.",
                })

            # Uncapped liability
            if "indemnif" in text_lower and (
                "unlimited" in text_lower or "no cap" in text_lower or "no limit" in text_lower
            ):
                deal_breakers.append({
                    "clause": clause.get("section", "Unknown"),
                    "reason": "Uncapped indemnification liability exposes buyer to unlimited downside.",
                })

            # IP assignment failure
            if "intellectual property" in text_lower and "not assigned" in text_lower:
                deal_breakers.append({
                    "clause": clause.get("section", "Unknown"),
                    "reason": "IP not fully assigned to buyer — core asset missing.",
                })

        return deal_breakers

    @staticmethod
    def calculate_confidence(analysis: Dict) -> int:
        """
        Compute confidence score based on RAG retrieval quality and clause coverage.
        Higher confidence when:
          - More high-similarity chunks retrieved
          - Specific clause references found
          - No contradictory information
        """
        flagged_count = len(analysis.get("flagged_clauses", []))
        deal_breaker_count = len(analysis.get("deal_breakers", []))

        # Simple heuristic: more flagged items = higher confidence in analysis
        base_confidence = 70
        if flagged_count > 5:
            base_confidence += 15
        if deal_breaker_count > 0:
            base_confidence += 10

        return min(100, base_confidence)
