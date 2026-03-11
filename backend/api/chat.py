"""
LexGuard AI — Chat Assistant API
Handles conversational queries about uploaded documents.
Uses RAG to ground answers in actual document text.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

from ai.llm_client import stream_chat
from ai.rag_pipeline import retrieve_relevant_chunks
from ai.prompts.chat import CHAT_RAG_TEMPLATE

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str


class ChatRequest(BaseModel):
    document_id: str
    messages: List[ChatMessage]


@router.post("/message")
async def send_chat_message(request: ChatRequest):
    """
    Send a message to the AI legal assistant.
    
    Flow:
      1. Extract user's latest question
      2. Retrieve relevant document chunks using RAG
      3. Build context + question prompt
      4. Stream Gemini response
    """
    if not request.messages:
        return {"response": "No messages provided"}

    # Get latest user message
    user_message = request.messages[-1].content

    try:
        # Retrieve relevant chunks from the document
        chunks = await retrieve_relevant_chunks(
            document_id=request.document_id,
            query=user_message,
            top_k=5,
        )

        # Build context
        context_text = "\n\n".join(f"[Clause {i+1}]\n{c['text']}" for i, c in enumerate(chunks))
        
        # If no chunks found, try to get document directly
        if not context_text:
            from services.document_processor import DocumentProcessor
            import os
            from config import UPLOAD_DIR
            
            # Find document file
            file_path = None
            for fname in os.listdir(UPLOAD_DIR):
                if fname.startswith(request.document_id):
                    file_path = os.path.join(UPLOAD_DIR, fname)
                    break
            
            if file_path and os.path.exists(file_path):
                raw_text = await DocumentProcessor.extract_text(file_path)
                # Use first 6000 chars as context
                context_text = f"[Document excerpt - first 6000 characters]\n{raw_text[:6000]}"
            else:
                context_text = "(Document not found or not yet analyzed)"
        
        rag_prompt = CHAT_RAG_TEMPLATE.format(
            context=context_text,
            question=user_message,
        )
    except Exception as e:
        print(f"[ERROR] Failed to retrieve document context: {str(e)}")
        rag_prompt = CHAT_RAG_TEMPLATE.format(
            context="(Unable to load document - please ensure it has been uploaded and analyzed)",
            question=user_message,
        )

    # Convert to Gemini message format
    gemini_messages = []
    for msg in request.messages[:-1]:  # all but the last
        gemini_messages.append({
            "role": msg.role,
            "parts": [{"text": msg.content}],
        })

    # Add RAG-enhanced question as the final message
    gemini_messages.append({
        "role": "user",
        "parts": [{"text": rag_prompt}],
    })

    # Generate response
    response_text = ""
    async for chunk in stream_chat(gemini_messages):
        response_text += chunk

    return {
        "response": response_text,
        "chunks_retrieved": len(chunks),
    }


@router.get("/history/{document_id}")
async def get_chat_history(document_id: str):
    """Retrieve chat history for a document (stub — query Supabase)."""
    # In production: query `chat_messages` table
    return {"messages": [], "document_id": document_id}
