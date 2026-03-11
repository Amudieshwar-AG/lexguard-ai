# LexGuard AI — System Architecture

This document explains the complete AI/NLP architecture for legal due diligence.

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND (Vite)                       │
│  • Dashboard  • Document Upload  • Risk Charts  • Chat         │
│  • Supabase Auth  • Real-time subscriptions                    │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP REST
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ API Routes   │  │  Services    │  │   AI Core    │         │
│  │              │  │              │  │              │         │
│  │ • Upload     │→ │ • Doc Parser │→ │ • LLM Client │         │
│  │ • Analysis   │→ │ • Risk Engine│→ │ • RAG        │         │
│  │ • Reports    │→ │ • Negotiator │→ │ • Embeddings │         │
│  │ • Chat       │→ │ • Report Gen │→ │ • Prompts    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
└────┬────────────────────┬────────────────────┬─────────────────┘
     │                    │                    │
     ↓                    ↓                    ↓
┌─────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  SUPABASE   │  │ GOOGLE GEMINI   │  │  FAISS VECTOR    │
│  (Postgres) │  │   1.5 Pro       │  │     STORE        │
│             │  │ text-embed-004  │  │ (In-Process)     │
│ • documents │  │                 │  │ • Per-doc index  │
│ • analyses  │  │ • Risk scoring  │  │ • RAG retrieval  │
│ • clauses   │  │ • Negotiation   │  │ • Semantic       │
│ • reports   │  │ • Chat          │  │   search         │
│ • chat logs │  │                 │  │                  │
└─────────────┘  └─────────────────┘  └──────────────────┘
```

---

## 🔄 Document Processing Pipeline

```
┌─────────────┐
│ User Uploads│
│  PDF/DOCX   │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: TEXT EXTRACTION                                      │
│ • PyMuPDF (PDF) / python-docx (DOCX)                        │
│ • Extract page-by-page, preserve structure                  │
└──────┬───────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: DOCUMENT CLASSIFICATION                              │
│ • Gemini Flash: classify as SPA, shareholder doc, etc.      │
│ • Prompt: first 3000 chars → returns category                │
└──────┬───────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: CLAUSE EXTRACTION                                    │
│ • Method 1: Gemini Flash parses sections intelligently       │
│ • Method 2 (fallback): Regex for "Section 7.2", etc.        │
│ • Each clause: {section, title, text, position}             │
└──────┬───────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: EMBEDDING & INDEXING                                 │
│ • text-embedding-004: 768-dim vectors                        │
│ • FAISS IndexFlatIP (cosine similarity via Inner Product)    │
│ • Store: {document_id}.faiss + {document_id}.meta.pkl        │
└──────┬───────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 5: STORE METADATA                                       │
│ • Supabase `documents` table                                 │
│ • Fields: file_name, document_type, clause_count, etc.      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI Risk Analysis Flow

```
┌─────────────────┐
│ Trigger Analysis│
│  (Frontend)     │
└────────┬────────┘
         │ POST /api/v1/analysis/analyze
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: RAG RETRIEVAL                                       │
│ • Query: "Find indemnification, liability, MAC clauses..."  │
│ • Embed query with text-embedding-004                       │
│ • FAISS search: top-12 most relevant chunks                 │
│ • Filter by similarity > 0.65                               │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: BUILD CONTEXT PROMPT                                │
│ • Assemble retrieved clauses into context block:            │
│   [Clause 1 — relevance 0.92]                               │
│   Section 7.2: Indemnification                              │
│   "The Seller agrees to indemnify..."                       │
│                                                              │
│   [Clause 2 — relevance 0.88]                               │
│   Section 12.3: Change of Control...                        │
│                                                              │
│ • Add task instruction:                                     │
│   "Identify risks, deal-breakers, negotiation points"       │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: GEMINI PRO ANALYSIS                                 │
│ • Model: gemini-1.5-pro                                     │
│ • Temperature: 0.1 (deterministic for legal analysis)       │
│ • System instruction:                                       │
│   "You are an M&A due diligence expert. Analyze for:        │
│    • Financial risks (indemnity caps, escrow)               │
│    • Shareholder rights (drag/tag, liquidation)             │
│    • Regulatory compliance gaps                             │
│    • Deal-breakers (change-of-control, IP issues)           │
│    • Negotiation opportunities"                             │
│ • Output: Structured JSON                                   │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: PARSE & VALIDATE                                    │
│ • Extract JSON from response (handle markdown code blocks)  │
│ • Validate schema: overall_risk_score, flagged_clauses, ... │
│ • Map risk_level: 0-40=low, 41-70=medium, 71-100=high       │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: STORE RESULTS                                       │
│ • Supabase `risk_analyses` table: summary, score, level     │
│ • Supabase `risk_clauses` table: each flagged clause        │
│ • Status: "completed"                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 💬 Chat Assistant Flow (RAG-Based)

```
┌────────────┐
│ User asks: │
│ "What's the│
│ indemnity  │
│ cap?"      │
└─────┬──────┘
      │
      ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: EMBED QUESTION                                      │
│ • text-embedding-004 → 768-dim vector                       │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: RAG RETRIEVAL                                       │
│ • FAISS search on document's vector index                   │
│ • Top-5 most similar clauses                                │
│ • Example result:                                           │
│   [Clause 7 — similarity 0.94]                              │
│   "Section 7.2: Indemnification. Cap set at $500,000..."    │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: BUILD RAG PROMPT                                    │
│ • "DOCUMENT CONTEXT:                                        │
│    [Clause 1] ...                                           │
│    [Clause 2] ...                                           │
│                                                              │
│    USER QUESTION: What's the indemnity cap?                 │
│                                                              │
│    Answer based only on the context above."                 │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: GEMINI FLASH RESPONSE                               │
│ • Model: gemini-1.5-flash (fast & cheap for chat)          │
│ • Temperature: 0.3 (slightly creative)                      │
│ • System: "Answer concisely, cite sections when relevant"   │
│ • Response: "The indemnity cap is set at $500,000 under     │
│   Section 7.2. This is relatively low given the target's    │
│   valuation."                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📄 Report Generation Flow

```
┌─────────────────┐
│ User clicks     │
│ "Generate Report│
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: FETCH DATA                                          │
│ • Query Supabase: document + analysis + clauses             │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: BUILD PDF (ReportLab)                               │
│ • Cover page: Title, risk badge (color-coded)               │
│ • Executive summary: AI text                                │
│ • Flagged clauses: Table with risk levels                   │
│ • Deal-breakers: Highlighted section                        │
│ • Disclaimer footer                                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: SAVE & STORE                                        │
│ • Save to: /backend/reports/generated_reports/              │
│ • Filename: LexGuard_Report_DocName_20260310_143022.pdf     │
│ • Store metadata in Supabase `reports` table                │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: DOWNLOAD LINK                                       │
│ • Return: { filename, file_path, report_id }                │
│ • Frontend: GET /api/v1/reports/download/{filename}         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Negotiation Engine Flow

```
┌────────────────┐
│ User flags:    │
│ "Indemnity cap │
│  too low"      │
└────────┬───────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: RAG RETRIEVAL                                       │
│ • Query: "Find clauses about: indemnity cap, liability..."  │
│ • Top-6 relevant clauses                                    │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: GEMINI PRO REDLINE GENERATION                       │
│ • Model: gemini-1.5-pro (temp=0.4, slightly creative)      │
│ • Prompt:                                                   │
│   "CONTEXT: [Retrieved clauses]                             │
│    CONCERNS: Indemnity cap too low                          │
│                                                              │
│    For each concern:                                        │
│    1. Quote original clause                                 │
│    2. Provide revised clause (track changes)                │
│    3. Explain business rationale                            │
│    4. Estimate negotiation difficulty"                      │
│                                                              │
│ • Output: JSON array of redlines                            │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: RETURN REDLINES                                     │
│ • Example:                                                  │
│   {                                                         │
│     "clause_reference": "Section 7.2",                      │
│     "original_text": "Cap: $500,000",                       │
│     "proposed_text": "Cap: $5,000,000, with carve-outs...", │
│     "rationale": "Raise to 10% of valuation...",            │
│     "difficulty": "medium"                                  │
│   }                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

```
┌────────────────────────────────────────────────────────────┐
│ FRONTEND (PUBLIC)                                          │
│ • Supabase anon key (safe to expose)                      │
│ • Row Level Security enforces user isolation               │
│ • JWT in localStorage → sent with every Supabase query     │
└────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│ BACKEND (PRIVATE)                                          │
│ • Supabase service key (bypasses RLS)                     │
│ • Gemini API key (never exposed to client)                 │
│ • Validates JWT from frontend (optional, recommended)      │
│ • All AI operations server-side only                       │
└────────────────────────────────────────────────────────────┘
```

**Security Rules:**
1. ✅ Frontend never sees Gemini API key
2. ✅ Frontend never sees Supabase service key
3. ✅ Row Level Security isolates users in DB
4. ✅ CORS restricts origins
5. ✅ File uploads validated (type, size)

---

## 📊 Data Flow Summary

| Step | Frontend | Backend | External |
|------|----------|---------|----------|
| 1. Upload | POST file → FastAPI | Save + process | Supabase Storage |
| 2. Extract | (wait) | PyMuPDF / docx | — |
| 3. Classify | (wait) | Send to Gemini | Gemini Flash |
| 4. Embed | (wait) | Generate embeddings | text-embedding-004 |
| 5. Index | (wait) | FAISS index | Local disk |
| 6. Analyze | Trigger API | RAG → Gemini Pro | Gemini 1.5 Pro |
| 7. Store | (wait) | Write to Supabase | Supabase |
| 8. Display | Fetch + render | — | Supabase (read) |

---

## 🚀 Scalability Considerations

### Current (MVP)
- FAISS in-process (per document)
- Gemini API (rate-limited: 60 RPM free tier)
- Supabase free tier

### Production
- Move FAISS to dedicated vector DB (Pinecone, Chroma, Weaviate)
- Gemini Pro tier (higher rate limits)
- Queue system for long-running analyses (Celery + Redis)
- Supabase Pro tier (higher limits)
- CDN for report downloads (Cloudflare R2, AWS S3)

---

## 📈 Performance Metrics

| Operation | Estimated Time |
|-----------|----------------|
| PDF text extraction | 1-3 seconds (50-page doc) |
| Clause extraction | 3-5 seconds (Gemini Flash) |
| Embedding generation | 5-10 seconds (100 clauses) |
| FAISS indexing | < 1 second |
| RAG retrieval | < 500ms |
| Risk analysis | 10-20 seconds (Gemini Pro) |
| Report PDF generation | 2-5 seconds |
| **Total (upload → report)** | **25-50 seconds** |

---

## 🎯 Key Design Decisions

1. **Why FAISS?** Fast, local, no external dependencies. Easy to start. Migrate to cloud vector DB later.

2. **Why RAG?** Prevents hallucination. Gemini sees exact clause text, not summaries.

3. **Why Gemini 1.5 Pro?** 1M token context window handles full legal docs. Structured output (JSON mode).

4. **Why FastAPI?** Async, fast, built-in OpenAPI docs, type safety.

5. **Why Supabase?** Postgres + auth + storage + real-time in one. Easy RLS.

6. **Why separate backend?** Never expose AI API keys to frontend. Server-side prompt injection protection.

---

This architecture is **production-ready** for MVP, with clear upgrade paths for scale.
