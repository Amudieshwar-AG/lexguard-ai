"""
LexGuard AI — Gemini LLM Client
Single point for all Gemini API calls. Handles retries, token limits, and error normalization.
"""

import asyncio
from typing import AsyncGenerator
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, GoogleAPIError
from fastapi import HTTPException
from config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_FLASH_MODEL
from ai.prompts.risk_analysis import RISK_ANALYSIS_SYSTEM

genai.configure(api_key=GEMINI_API_KEY)

# ─── Generation configs ─────────────────────────────────────────────────────
_CAREFUL_CONFIG = genai.GenerationConfig(
    temperature=0.1,        # near-deterministic for legal analysis
    top_p=0.95,
    max_output_tokens=8192,  # Increased for comprehensive risk analysis with full clause details
)

_CREATIVE_CONFIG = genai.GenerationConfig(
    temperature=0.4,        # slightly creative for negotiation suggestions
    top_p=0.95,
    max_output_tokens=2048,
)

_FAST_CONFIG = genai.GenerationConfig(
    temperature=0.0,
    max_output_tokens=1024,
)

_DEFAULT_SYSTEM = (
    "You are LexGuard AI, an expert legal analyst specializing in M&A due diligence. "
    "You analyze financial agreements, shareholder documents, and regulatory filings to identify "
    "risks, deal-breakers, and negotiation points. Always respond with precise, structured, "
    "legally-aware analysis. Never hallucinate clauses — only report what is present in the provided text."
)


def _get_model(model_name: str, config: genai.GenerationConfig) -> genai.GenerativeModel:
    """Return a GenerativeModel with safety settings to allow legal content."""
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]
    return genai.GenerativeModel(
        model_name=model_name, 
        generation_config=config,
        safety_settings=safety_settings
    )


def _with_system(system: str, prompt: str) -> str:
    """Prepend system instruction to the user prompt (SDK v0.3.x compatible)."""
    return f"{system}\n\n---\n\n{prompt}"


async def generate_analysis(prompt: str) -> str:
    """
    Use the full Gemini model for deep risk analysis.
    RISK_ANALYSIS_SYSTEM is prepended to the prompt so Gemini is primed to
    specifically hunt for Liability, Termination, Non-Compete, and Indemnity clauses.
    """
    model = _get_model(GEMINI_MODEL, _CAREFUL_CONFIG)
    full_prompt = _with_system(RISK_ANALYSIS_SYSTEM, prompt)
    try:
        response = await asyncio.to_thread(model.generate_content, full_prompt)
        
        # Debug: Check response object structure
        print(f"[DEBUG] Response type: {type(response)}")
        print(f"[DEBUG] Response has 'text': {hasattr(response, 'text')}")
        print(f"[DEBUG] Response has 'candidates': {hasattr(response, 'candidates')}")
        
        # Get full response text with all candidates
        result_text = ""
        if hasattr(response, 'text'):
            result_text = response.text
            print(f"[DEBUG] Got text directly, length: {len(result_text)}")
        elif hasattr(response, 'candidates') and len(response.candidates) > 0:
            # Try to get text from first candidate's content parts
            candidate = response.candidates[0]
            print(f"[DEBUG] Using candidate, finish_reason: {candidate.finish_reason if hasattr(candidate, 'finish_reason') else 'unknown'}")
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                parts = [part.text for part in candidate.content.parts if hasattr(part, 'text')]
                result_text = "".join(parts)
                print(f"[DEBUG] Got {len(parts)} parts, total length: {len(result_text)}")
        
        print(f"[DEBUG] Final response length: {len(result_text)} chars")
        return result_text
    except ResourceExhausted:
        raise HTTPException(
            status_code=429,
            detail="Gemini API rate limit reached. Please wait 60 seconds and try again."
        )
    except GoogleAPIError as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")


async def generate_negotiation(prompt: str) -> str:
    model = _get_model(GEMINI_MODEL, _CREATIVE_CONFIG)
    full_prompt = _with_system(_DEFAULT_SYSTEM, prompt)
    try:
        response = await asyncio.to_thread(model.generate_content, full_prompt)
        return response.text
    except ResourceExhausted:
        raise HTTPException(status_code=429, detail="Gemini API rate limit reached. Please wait 60 seconds and try again.")
    except GoogleAPIError as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")


async def generate_fast(prompt: str) -> str:
    model = _get_model(GEMINI_FLASH_MODEL, _FAST_CONFIG)
    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        return response.text
    except ResourceExhausted:
        raise HTTPException(status_code=429, detail="Gemini API rate limit reached. Please wait 60 seconds and try again.")
    except GoogleAPIError as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")


async def stream_chat(messages: list[dict]) -> AsyncGenerator[str, None]:
    """
    Streaming chat for the AI assistant panel.
    messages: [{"role": "user" | "model", "parts": [{"text": "..."}]}]
    """
    model = _get_model(GEMINI_FLASH_MODEL, genai.GenerationConfig(temperature=0.3, max_output_tokens=2048))
    chat_system = (
        "You are LexGuard AI, a legal due diligence assistant. "
        "Answer questions about uploaded legal documents concisely and accurately. "
        "If you don't know something from the document context, say so. "
        "Highlight risks, obligations, and key dates when relevant."
    )
    # Inject system as first user turn if history is empty
    history = messages[:-1]
    last_msg = messages[-1]["parts"][0]["text"]
    if not history:
        last_msg = _with_system(chat_system, last_msg)
    chat = model.start_chat(history=history)
    response = await asyncio.to_thread(chat.send_message, last_msg, stream=False)
    yield response.text

