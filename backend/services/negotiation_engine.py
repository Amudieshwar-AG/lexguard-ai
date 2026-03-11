"""
LexGuard AI — Negotiation Engine
Generates redline suggestions and negotiation strategies for flagged clauses.
"""

import json
from typing import List, Dict
from ai.llm_client import generate_negotiation
from ai.rag_pipeline import retrieve_relevant_chunks, build_context_prompt
from ai.prompts.risk_analysis import NEGOTIATION_PROMPT_TEMPLATE


class NegotiationEngine:
    """
    Provides redline suggestions and negotiation tactics for risky clauses.
    Tailored for M&A context: focus on caps, warranties, and MAC clauses.
    """

    @staticmethod
    async def generate_redlines(
        document_id: str,
        concerns: List[str],
    ) -> List[Dict]:
        """
        Given a list of buyer concerns (e.g., "Indemnity cap too low"),
        retrieve relevant clauses and generate redline recommendations.

        Returns: [
          {
            "clause_reference": "Section 7.2",
            "original_text": "...",
            "proposed_text": "...",
            "rationale": "...",
            "difficulty": "medium"
          }
        ]
        """
        query = f"Find clauses related to: {', '.join(concerns)}"
        relevant_chunks = await retrieve_relevant_chunks(document_id, query, top_k=6)

        context = build_context_prompt(relevant_chunks, query)
        prompt = NEGOTIATION_PROMPT_TEMPLATE.format(
            context=context,
            concerns="\n".join(f"• {c}" for c in concerns),
        )

        raw_response = await generate_negotiation(prompt)

        # Parse JSON
        try:
            if "```json" in raw_response:
                json_str = raw_response.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_response:
                json_str = raw_response.split("```")[1].split("```")[0].strip()
            else:
                json_str = raw_response.strip()

            redlines = json.loads(json_str)
        except json.JSONDecodeError:
            redlines = [{
                "clause_reference": "Unknown",
                "original_text": "",
                "proposed_text": "",
                "rationale": "Failed to parse AI response",
                "difficulty": "unknown",
                "error": raw_response[:500],
            }]

        return redlines

    @staticmethod
    def suggest_negotiation_priorities(flagged_clauses: List[Dict]) -> List[str]:
        """
        Given a list of flagged clauses, return a prioritized list of negotiation points.
        High-risk clauses come first, then medium-risk.
        """
        priorities = []

        # Sort by risk level
        high_risk = [c for c in flagged_clauses if c.get("risk_level") == "high"]
        med_risk = [c for c in flagged_clauses if c.get("risk_level") == "medium"]

        for clause in high_risk:
            priorities.append(
                f"🔴 HIGH PRIORITY: {clause.get('clause_title')} — {clause.get('recommendation', 'Review required')}"
            )

        for clause in med_risk:
            priorities.append(
                f"🟡 MEDIUM: {clause.get('clause_title')} — {clause.get('recommendation', 'Consider negotiation')}"
            )

        return priorities

    @staticmethod
    def estimate_deal_feasibility(
        overall_risk_score: int,
        deal_breakers: List[Dict],
    ) -> Dict:
        """
        Provide an executive assessment: is this deal salvageable?
        """
        if len(deal_breakers) >= 3:
            return {
                "verdict": "NOT RECOMMENDED",
                "reason": f"{len(deal_breakers)} critical deal-breakers identified. Walk away or demand major restructuring.",
                "color": "red",
            }
        elif len(deal_breakers) > 0 or overall_risk_score >= 80:
            return {
                "verdict": "PROCEED WITH CAUTION",
                "reason": f"Risk score {overall_risk_score}. {len(deal_breakers)} deal-breakers. Negotiate aggressively.",
                "color": "amber",
            }
        elif overall_risk_score >= 50:
            return {
                "verdict": "ACCEPTABLE WITH NEGOTIATION",
                "reason": "Moderate risk. Address flagged clauses before closing.",
                "color": "yellow",
            }
        else:
            return {
                "verdict": "GOOD DEAL",
                "reason": "Low risk profile. Minor clause cleanup recommended.",
                "color": "green",
            }
