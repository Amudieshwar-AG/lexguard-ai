# LexGuard AI — Backend

**AI-Driven Legal Due Diligence for Business Acquisition**

This backend processes financial agreements, shareholder documents, and regulatory filings to produce structured risk reports highlighting deal-breakers and negotiation points.

---

## 🏗️ Architecture

```
React Frontend (localhost:5173)
         ↓
FastAPI Backend (localhost:8000)
         ↓
    ┌────────┴────────┐
    ↓                 ↓
Google Gemini     Supabase
(AI Analysis)   (Database + Storage)
    ↓
FAISS Vector Store
(RAG Retrieval)
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add:
- **GEMINI_API_KEY**: Get from https://aistudio.google.com/app/apikey
- **SUPABASE_SERVICE_KEY**: Get from Supabase Dashboard → Settings → API

### 3. Run the Server

```bash
uvicorn main:app --reload --port 8000
```

Server runs at: **http://localhost:8000**
API docs: **http://localhost:8000/docs** (Swagger UI)

---

## 📁 Project Structure

```
backend/
├── main.py                    # FastAPI app entry point
├── config.py                  # All env vars & constants
│
├── api/                       # REST endpoints
│   ├── upload.py             # Document upload & processing
│   ├── analysis.py           # Risk analysis triggers
│   ├── negotiation.py        # Redline suggestions
│   ├── reports.py            # PDF report generation
│   └── chat.py               # AI assistant chat
│
├── services/                  # Business logic layer
│   ├── document_processor.py # PDF/DOCX text extraction
│   ├── clause_extractor.py   # Clause segmentation
│   ├── risk_engine.py        # ★ CORE: Risk scoring + deal-breakers
│   ├── negotiation_engine.py # Redline generation
│   └── report_generator.py   # PDF builder
│
├── ai/                        # AI/ML core
│   ├── llm_client.py         # Gemini API wrapper
│   ├── embeddings.py         # text-embedding-004
│   ├── rag_pipeline.py       # Retrieval-Augmented Generation
│   └── prompts/
│       ├── risk_analysis.py  # ★ CORE: Risk analysis prompts
│       └── chat.py           # Chat assistant prompts
│
├── database/
│   ├── models.py             # Pydantic models + SQL schemas
│   └── db.py                 # Supabase client wrapper
│
├── utils/
│   └── chunking.py           # Text splitting utilities
│
├── data/uploaded_docs/       # Uploaded files
├── vector_store/faiss_index/ # FAISS indexes per document
└── reports/generated_reports/# Generated PDFs
```

---

## 🧠 AI/NLP Pipeline

### Document Upload Flow

```
1. User uploads PDF/DOCX
2. Extract text (PyMuPDF / python-docx)
3. Classify document type (Gemini Flash)
4. Segment into clauses (Gemini Flash + heuristics)
5. Generate embeddings (text-embedding-004)
6. Index in FAISS vector store
7. Store metadata in Supabase
```

### Risk Analysis Flow

```
1. Frontend triggers /api/v1/analysis/analyze
2. RAG retrieves top-k relevant clauses for:
   - Indemnification
   - Liability caps
   - MAC clauses
   - Change of control
   - IP assignment
   - Regulatory compliance
3. Build prompt with retrieved context
4. Send to Gemini Pro 1.5 (temperature=0.1 for consistency)
5. Parse structured JSON response:
   {
     "overall_risk_score": 0-100,
     "risk_level": "low" | "medium" | "high",
     "flagged_clauses": [...],
     "deal_breakers": [...]
   }
6. Store in Supabase risk_analyses + risk_clauses tables
```

### Negotiation Flow

```
1. User flags concerns: ["Indemnity cap too low", "MAC clause vague"]
2. RAG retrieves relevant clauses
3. Gemini Pro generates redlines:
   - Original text
   - Proposed revision
   - Business rationale
   - Negotiation difficulty (easy/medium/hard)
4. Return to frontend
```

### Chat Assistant Flow

```
1. User asks: "What's the indemnity cap?"
2. RAG retrieves top-5 relevant chunks
3. Build context + question prompt
4. Stream Gemini Flash response
5. Answer grounded in document text (no hallucination)
```

---

## 🔑 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/documents/upload` | POST | Upload document |
| `/api/v1/analysis/analyze` | POST | Run risk analysis |
| `/api/v1/negotiation/redlines` | POST | Generate redlines |
| `/api/v1/negotiation/feasibility` | POST | Assess deal feasibility |
| `/api/v1/reports/generate` | POST | Generate PDF report |
| `/api/v1/reports/download/{filename}` | GET | Download report |
| `/api/v1/chat/message` | POST | Chat with AI assistant |

Full interactive docs: **http://localhost:8000/docs**

---

## 🎯 Problem Statement Focus

This backend is **specifically designed** for:

✅ **Financial Agreements**
- Indemnity caps, escrow, earn-outs
- Liability limitations
- Payment terms

✅ **Shareholder Documents**
- Voting rights, drag/tag-along
- Liquidation preferences
- Anti-dilution provisions

✅ **Regulatory Filings**
- Compliance gaps
- Missing disclosures
- Violation flags

✅ **Deal-Breakers**
- Change-of-control termination rights
- Material Adverse Change (MAC) clauses
- IP assignment failures
- Uncapped liabilities

✅ **Negotiation Points**
- Caps to raise
- Warranties to strengthen
- Clauses to redline

---

## 🧪 Testing

```bash
# Start server
uvicorn main:app --reload

# Test upload
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -F "file=@./sample_agreement.pdf"

# Test analysis
curl -X POST http://localhost:8000/api/v1/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{"document_id": "your-doc-id", "document_type": "share_purchase_agreement"}'
```

Or use the Swagger UI: **http://localhost:8000/docs**

---

## 📦 Production Deployment

### Option 1: Railway / Render

1. Push code to GitHub
2. Connect Railway/Render to repo
3. Set env vars in dashboard
4. Deploy

### Option 2: Docker

```bash
# Create Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Build & run
docker build -t lexguard-backend .
docker run -p 8000:8000 --env-file .env lexguard-backend
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | FastAPI 0.109 |
| LLM | Google Gemini 1.5 Pro |
| Embeddings | text-embedding-004 |
| Vector DB | FAISS |
| Database | Supabase (PostgreSQL) |
| PDF Extract | PyMuPDF |
| DOCX Extract | python-docx |
| PDF Reports | ReportLab |

---

## 🔐 Security Notes

- **NEVER** expose `SUPABASE_SERVICE_KEY` to frontend
- Service key bypasses Row Level Security — backend use only
- Use Supabase Row Level Security for user isolation
- Gemini API key is backend-only (never sent to client)

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `services/risk_engine.py` | ★ CORE risk scoring logic |
| `ai/prompts/risk_analysis.py` | ★ CORE analysis prompts |
| `ai/rag_pipeline.py` | RAG retrieval & context building |
| `ai/llm_client.py` | Gemini API calls |
| `services/clause_extractor.py` | Clause segmentation |

---

## 🤝 Integration with Frontend

The React frontend (src/hooks/) expects these responses:

```typescript
// useRiskAnalysis.ts expects:
{
  overall_risk_score: number,
  risk_level: "low" | "medium" | "high",
  ai_summary: string,
  flagged_clauses: [{
    clause_reference: string,
    clause_title: string,
    risk_level: string,
    description: string,
    recommendation: string
  }]
}

// useReports.ts expects:
{
  report_id: string,
  filename: string,
  file_path: string
}
```

Backend already returns these formats. Just connect the APIs.

---

## 📞 Support

Questions? Check:
- Swagger docs: http://localhost:8000/docs
- Gemini docs: https://ai.google.dev/docs
- Supabase docs: https://supabase.com/docs
