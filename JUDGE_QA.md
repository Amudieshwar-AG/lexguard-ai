# LexGuard AI — Hackathon Judge Q&A

> **Prepared for:** National-level hackathon demo  
> **Project:** LexGuard AI — AI-powered M&A Legal Due Diligence Platform  
> **Stack:** React + FastAPI + Google Gemini + FAISS + Supabase

---

## TABLE OF CONTENTS

1. [Problem & Market](#1-problem--market)
2. [Product Demo Questions](#2-product-demo-questions)
3. [Technical Architecture](#3-technical-architecture)
4. [AI / Machine Learning](#4-ai--machine-learning)
5. [RAG Pipeline Deep Dive](#5-rag-pipeline-deep-dive)
6. [Security & Privacy](#6-security--privacy)
7. [Scalability & Performance](#7-scalability--performance)
8. [Business Viability](#8-business-viability)
9. [Innovation & Differentiation](#9-innovation--differentiation)
10. [Ethical & Legal Considerations](#10-ethical--legal-considerations)
11. [Team & Execution](#11-team--execution)
12. [Failure Modes & Stress Testing](#12-failure-modes--stress-testing)

---

## 1. PROBLEM & MARKET

---

**Q: What exact problem does LexGuard AI solve?**

> During Mergers & Acquisitions (M&A), buyers must review hundreds of pages of legal documents — Share Purchase Agreements (SPAs), shareholder agreements, non-disclosure agreements, regulatory filings — to identify risks before closing a deal. A single missed clause (e.g., uncapped indemnity, customer auto-termination rights, 5-year non-compete) can cost millions post-acquisition.
>
> Today this is done manually by large law firms, taking 4–8 weeks and costing $50,000–$500,000 per deal. LexGuard AI automates the first-pass risk review in minutes, flagging the clauses that matter most before human lawyers deep-dive.

---

**Q: Why M&A specifically? Why not all legal documents?**

> M&A deals have a uniquely structured set of high-risk clause categories — liability caps, termination triggers, indemnity obligations, non-compete restrictions — that are consistently present across deal types and have known best-practice standards. This makes them ideal for AI analysis because the model can be trained on what "dangerous" looks like vs. "market standard."
>
> Starting focused lets us build deep accuracy in one vertical rather than shallow coverage across all legal domains. Expansion to employment contracts and vendor agreements is on the roadmap.

---

**Q: Who is your target user?**

> Three profiles:
> 1. **In-house M&A counsel** at mid-market PE firms ($100M–$2B deal size) who need rapid preliminary screening before engaging outside counsel
> 2. **M&A analysts** at investment banks who prepare deal memos and need clause summaries
> 3. **Startup founders** being acquired (first-time sellers) who can't afford $400/hr lawyers for initial review
>
> Primary focus: in-house legal teams at funds doing 3–10 deals per year.

---

**Q: What is the market size?**

> Global M&A legal services market is ~$55B annually (2024). Due diligence software is a $3.2B sub-segment growing at ~18% CAGR, driven by AI adoption. Even capturing 0.5% of that is a $16M ARR opportunity within 3–5 years. Additionally the adjacent contract review market (NDA, employment) is ~$40B.

---

## 2. PRODUCT DEMO QUESTIONS

---

**Q: Walk me through what a user does from logging in to getting a risk report.**

> 1. User creates an account and logs in (Supabase-backed authentication)
> 2. Uploads a PDF or DOCX legal document via drag-and-drop (up to 50MB)
> 3. The backend extracts text, classifies the document type (SPA, NDA, shareholder agreement, etc.), and splits it into semantic clauses
> 4. All clauses are embedded as 768-dimensional vectors and indexed in FAISS
> 5. User clicks "Analyze Risk" — the AI retrieves the most relevant clauses via semantic search, feeds them to Gemini 1.5-Pro with a specialized legal prompt, and returns a structured JSON risk report
> 6. Dashboard shows: overall risk score (0–100), risk level (Low/Medium/High), breakdown by clause type (liability, termination, non-compete, indemnity), list of flagged clauses with recommendations, and auto-detected deal-breakers
> 7. User can ask questions in the AI chat ("What is the liability cap?") backed by the same document context
> 8. User generates a downloadable PDF due diligence report marked "CONFIDENTIAL & PRIVILEGED"

---

**Q: What document formats do you support?**

> PDF (via PyMuPDF) and DOCX (via python-docx). These cover ~95% of legal documents exchanged in M&A transactions. Support for plain text and scanned PDFs (via OCR) is on the roadmap.

---

**Q: What does the risk score (0–100) represent exactly?**

> It is not an arbitrary number — it is computed from weighted factors:
> - Presence and severity of uncapped liability clauses
> - Termination trigger breadth (broad MAC clauses = higher risk)
> - Non-compete scope (geography + duration)
> - Indemnity gap (no cap, no survival period limit)
> - Deal-breaker detection (change-of-control clauses, IP ownership failures)
>
> Score of 0–30 = Low risk (market standard terms), 31–65 = Medium (negotiation needed), 66–100 = High (deal-breaker territory).

---

**Q: What are "deal-breakers" specifically?**

> Auto-detected conditions that typically kill or severely reprice deals:
> - **Change-of-control trigger**: Customer contracts that auto-terminate on acquisition
> - **Uncapped liability**: No ceiling on indemnity obligations (unlimited exposure)
> - **IP ownership failure**: Key IP owned by founders personally, not the company being sold
> - **MAC clause ambiguity**: Material Adverse Change triggers so broad they could be invoked at will
> - **5+ year non-compete**: Restricts seller from operating in their expertise area for too long

---

**Q: What is the Negotiation Engine feature?**

> After identifying risky clauses, users can input their concerns (e.g., "indemnity cap is too low at 20% of deal value"). The engine:
> 1. Retrieves the exact clause text via RAG
> 2. Asks Gemini to produce a "redline" — a modified version of the clause (track-changes style) favoring the buyer
> 3. Provides business rationale and negotiation difficulty rating (easy/medium/hard)
> 4. Outputs a deal feasibility verdict: 🔴 NOT RECOMMENDED / 🟡 PROCEED WITH CAUTION / 🟢 GOOD DEAL

---

## 3. TECHNICAL ARCHITECTURE

---

**Q: Explain your architecture in simple terms.**

> The app has three layers:
>
> **Frontend** (React + TypeScript on Vercel): The UI that lawyers interact with — dashboard panels for upload, risk view, analytics, chat, and report download.
>
> **Backend** (FastAPI on Render): The brain — receives documents, processes them, runs AI analysis, manages the vector store, generates reports. Exposes a REST API.
>
> **External Services**: Google Gemini API (language model + embeddings), Supabase (PostgreSQL database + authentication + file storage), FAISS (in-process vector similarity search).

---

**Q: Why FastAPI instead of Django or Flask?**

> Three reasons:
> 1. **Async-native**: Document processing and Gemini API calls are I/O-bound. FastAPI's async support means the server handles multiple uploads concurrently without blocking.
> 2. **Automatic documentation**: FastAPI generates OpenAPI docs out of the box — useful for iterating quickly.
> 3. **Pydantic validation**: Request/response schemas are validated automatically with typed Python models, which reduces bugs at API boundaries.
>
> Flask would require adding async support manually. Django is too opinionated for a microservice-style backend.

---

**Q: Why Supabase for the database?**

> Supabase gives us three things in one:
> 1. **PostgreSQL** — structured storage for documents, analyses, risk clauses, reports
> 2. **Authentication** — JWT-based email/password auth out of the box, no custom auth code needed
> 3. **File Storage** — document upload storage bucket without needing S3
>
> For a hackathon project, this eliminates three separate infrastructure concerns. In production, we'd consider separating these concerns as scale demands.

---

**Q: Why store the vector index on disk (FAISS) instead of a cloud vector DB like Pinecone?**

> FAISS on disk was chosen for:
> 1. **Zero API cost** — Pinecone charges per query/storage. For a demo/MVP, FAISS is free.
> 2. **Speed** — in-process, no network round-trip for search
> 3. **Control** — per-document indexes (`{document_id}.faiss`) allow easy isolation and deletion
>
> The trade-off: not horizontally scalable (FAISS lives on one server's disk). Production migration path: swap `rag_pipeline.py` to use Pinecone or Weaviate — the interface is the same (embed → search → return chunks).

---

**Q: How does your frontend communicate with the backend?**

> Standard REST over HTTPS. The React frontend calls the FastAPI backend at `VITE_API_URL` (configured via environment variable). All API routes are under `/api/v1/`. CORS is configured on the backend to allow only the registered Vercel domain (plus localhost for development).
>
> For auth, Supabase issues a JWT that is stored in sessionStorage (not localStorage — cleared on tab close for security). The JWT is passed to the backend on document-related requests for user isolation.

---

**Q: Why sessionStorage instead of localStorage for the auth token?**

> Security decision: localStorage persists until explicitly cleared — if an XSS attack injects a script, it can steal the token indefinitely. sessionStorage is cleared when the browser tab closes, reducing the attack window. Combined with `persistSession: false` in the Supabase client, every new session requires a fresh login.

---

## 4. AI / MACHINE LEARNING

---

**Q: Did you train a custom model or use existing APIs?**

> We use Google Gemini via API — no custom model training. The "intelligence" comes from:
> 1. **Prompt engineering**: Carefully crafted system prompts that instruct Gemini to behave as an M&A specialist and output strict JSON
> 2. **RAG (Retrieval-Augmented Generation)**: Constraining the model to only reason about retrieved document chunks — preventing hallucination
> 3. **Temperature tuning**: 0.1 for legal analysis (near-deterministic), 0.4 for negotiation suggestions (creative)
>
> Custom fine-tuning would require annotated M&A document datasets we don't have. For a v1, prompt engineering + RAG gives 80% of the value at 0% of the training cost.

---

**Q: Which Gemini model do you use and why?**

> Two models:
> - **`gemini-2.5-flash`** — main model for full risk analysis and negotiation (high quality, 8k output tokens)
> - **`gemini-2.0-flash-lite`** — fast model for quick tasks: document type classification, clause extraction (lower latency, cheaper)
> - **`text-embedding-001`** — for generating 768-dimensional text embeddings used in vector search
>
> We deliberately use different models for different tasks rather than using one model for everything, optimizing for cost and speed per use case.

---

**Q: How do you prevent the AI from hallucinating?**

> Three mechanisms:
> 1. **RAG grounding**: The system prompt explicitly says "Only report clauses that are PRESENT in the provided document context. Do not invent or assume clauses." The model only receives retrieved clause text, not its general training knowledge.
> 2. **Low temperature**: 0.1 for analysis means the model picks the most statistically likely correct answer rather than exploring creative variations.
> 3. **Structured output validation**: We expect strict JSON. If the JSON doesn't parse, we attempt 4 fallback extraction strategies before returning an error — we never silently return hallucinated content.

---

**Q: What is the embedding dimension and why does it matter?**

> We use 768-dimensional vectors from Google's `text-embedding-001` model. Dimension determines how much semantic information is encoded per chunk:
> - Higher dimension → more nuanced similarity matching
> - Lower dimension → faster search, less memory
>
> 768 is the standard for BERT-class models and is well-supported by FAISS's `IndexFlatIP` (inner product / cosine similarity). We normalize vectors before storing so cosine similarity equals inner product — FAISS is fast at inner product search.

---

**Q: How does the AI understand legal language specifically?**

> Gemini 1.5-Pro is trained on a massive corpus that includes legal text, case law, and contract templates. It has baseline understanding of legal terminology. Our contribution is:
> 1. Directing it to specific risk categories (liability caps, MAC triggers, etc.)
> 2. Providing it concrete document context so it analyzes the actual contract, not generic legal knowledge
> 3. Instructing it to produce actionable recommendations, not generic commentary
>
> We don't claim the model is a licensed lawyer — it's a research tool that surfaces issues for human lawyers to validate.

---

## 5. RAG PIPELINE DEEP DIVE

---

**Q: Explain your RAG pipeline step by step.**

> **Indexing phase (at upload time):**
> 1. Extract full text from PDF/DOCX
> 2. Use Gemini Flash to intelligently identify clause boundaries (section numbers like "7.2", "Article 5")
> 3. If LLM clause splitting fails, fall back to regex pattern matching on section numbers, then paragraph splitting with 150-character overlap
> 4. Each clause chunk embedded via `text-embedding-001` → 768-dim float32 vector
> 5. All vectors stored in `FAISS IndexFlatIP`, saved to disk as `{document_id}.faiss` + `{document_id}.meta.pkl` (maps vector index → original text)
>
> **Query phase (at analysis time):**
> 1. Construct a retrieval query ("Find liability caps, indemnity obligations, termination clauses...")
> 2. Embed the query → 768-dim vector
> 3. Normalize and run FAISS `index.search(query_vec, top_k=12)`
> 4. Filter out chunks with similarity score < 0.65 (noise threshold)
> 5. Format retrieved chunks with similarity scores into context block
> 6. Append task instruction to context block → send to Gemini
> 7. Parse structured JSON response → return risk report

---

**Q: Why top_k=12? Why not more or fewer chunks?**

> 12 chunks × ~800 characters = ~9,600 characters of context — well within Gemini's context window while ensuring we surface enough examples of each clause type. In testing, fewer than 8 chunks missed edge cases; more than 15 diluted the relevant signal with lower-similarity chunks. 12 is an empirically chosen balance.

---

**Q: What is the 0.65 similarity threshold based on?**

> Empirical testing: chunks with FAISS inner product score below 0.65 (on normalized vectors) were consistently off-topic and introduced noise into the analysis. Above 0.65, retrieved chunks were reliably relevant to the query. This is a hyperparameter that would be tuned further with more data.

---

**Q: What happens if a document has no matching clauses above the threshold?**

> We have a fallback: if FAISS returns zero chunks above the threshold (e.g., a very short document or unusual formatting), the system falls back to feeding the raw first 12,000 characters of the document directly to Gemini as context. This ensures analysis always completes, though with potentially lower confidence. The `confidence_score` field in the response reflects this — lower when falling back.

---

**Q: Can FAISS handle very large documents with thousands of clauses?**

> For typical M&A documents (50–300 pages), we're looking at 100–500 clause chunks — FAISS handles this trivially. `IndexFlatIP` performs exact nearest-neighbor search at O(n×d) time. For documents with 10,000+ chunks, we'd switch to `IndexIVFFlat` (approximate nearest-neighbor) which indexes clusters first. The interface change is minimal and already planned in `rag_pipeline.py`.

---

## 6. SECURITY & PRIVACY

---

**Q: Legal documents contain highly sensitive M&A information. How do you handle data security?**

> Several layers:
> 1. **Auth**: Supabase JWT authentication — every API request is tied to a user identity
> 2. **User isolation**: Documents, analyses, and reports are scoped to `user_id` — users cannot access each other's data
> 3. **No localStorage**: Auth tokens stored in `sessionStorage` only — cleared on tab close
> 4. **HTTPS only**: All API communication is TLS-encrypted (enforced by Render and Vercel)
> 5. **Service key protection**: The Supabase service role key (which bypasses Row Level Security) is backend-only, never exposed to the frontend
> 6. **CORS lockdown**: Backend only accepts requests from the registered Vercel domain
>
> In production, we'd add: document encryption at rest, audit logging of all document access, and SOC 2 / ISO 27001 compliance planning.

---

**Q: Do you store the actual document content or just vectors?**

> Both, currently:
> - **Supabase Storage**: Original file uploaded by the user
> - **FAISS + pickle**: Extracted clause text (used for context retrieval)
> - **Supabase PostgreSQL**: Document metadata (filename, type, page count, clause count)
>
> The clause text in FAISS pickle files contains the actual extracted content. In a production deployment, we'd encrypt these pickle files at rest and implement a data retention policy (auto-delete after N days).

---

**Q: What's your GDPR/data compliance posture?**

> Currently MVP-level — not production-compliant with GDPR. Steps needed for compliance:
> 1. Explicit data processing consent at registration
> 2. Right to erasure: delete all user data (documents, analyses, vectors) on request
> 3. Data residency: host in EU region for EU users
> 4. DPA (Data Processing Agreement) with Google (Gemini), Supabase
>
> The architecture supports implementing these — user_id scoping means we can delete all records for a user. This is on the roadmap before any commercial launch.

---

**Q: You're sending confidential legal documents to Google Gemini's API. Is that a problem?**

> This is a valid concern and the biggest enterprise sales blocker. Our mitigation:
> 1. Google's API terms state customer data is not used to train models (with enterprise agreements)
> 2. For enterprise customers, we'd offer: on-premise Gemini deployment (Google Distributed Cloud), or swap to an open-source model (Llama 3, Mistral) running on customer infrastructure
> 3. The RAG architecture is model-agnostic — swapping the LLM is a one-file change in `llm_client.py`
>
> We proactively disclose this limitation to users.

---

## 7. SCALABILITY & PERFORMANCE

---

**Q: How long does full analysis take on a 100-page document?**

> Breakdown:
> - Text extraction: ~1–2 seconds (PyMuPDF is fast)
> - LLM clause extraction (15k chars): ~3–5 seconds (Gemini Flash)
> - Embedding all clauses (100 clauses in batches of 20): ~5–10 seconds (5 API calls)
> - FAISS indexing: <0.1 second
> - Risk analysis RAG query + Gemini generation: ~8–15 seconds
>
> Total: approximately **20–35 seconds** for upload + analysis on a 100-page document. For a due diligence task that would otherwise take a lawyer 2–4 hours, this is a 99.7% time reduction.

---

**Q: What's your current system's throughput limit?**

> On Render's free tier (0.5 CPU, 512MB RAM), we'd bottleneck at 2–3 concurrent analysis requests before queuing. This is sufficient for a demo.
>
> Production path: move to Render Standard ($25/mo, 1 CPU/2GB) or add a task queue (Celery + Redis). The embedding and LLM calls can be parallelized within a single document analysis using `asyncio.gather()`.

---

**Q: Could you handle a large law firm uploading 50 documents simultaneously?**

> Not today on the current setup. Production architecture would need:
> 1. Background job queue (Celery/Redis or BullMQ) for document processing
> 2. Horizontal scaling of FastAPI workers (Render scales to N instances)
> 3. Shared FAISS store or migration to Pinecone (disk-based FAISS doesn't work across multiple servers)
> 4. CDN for report PDF delivery
>
> The code is structured to support this — the processing pipeline is in `services/` layer, decoupled from the API layer.

---

**Q: What's your database query performance like?**

> Supabase PostgreSQL with indexed UUID primary keys. For the current data model:
> - Document lookup by `document_id`: O(1) with UUID index
> - User's document list: O(n) scan on `user_id` — would add an index in production
> - Risk clause lookup by `risk_analysis_id`: foreign key, indexed
>
> For the expected data volume (hundreds of documents per user, not millions), query performance is not a concern at this stage.

---

## 8. BUSINESS VIABILITY

---

**Q: How would you monetize this?**

> **SaaS subscription tiers:**
>
> | Tier | Price | Limits |
> |------|-------|--------|
> | Starter | $199/mo | 10 documents/mo, basic risk report |
> | Professional | $799/mo | 50 documents/mo, negotiation engine, PDF reports |
> | Enterprise | Custom (~$2,000–5,000/mo) | Unlimited, on-premise LLM option, SSO, audit logs |
>
> The marginal cost per analysis (Gemini API + compute) is ~$0.05–$0.15. At $199/mo for 10 documents, gross margin is >90%.
>
> Secondary revenue: API access for law firm practice management software (B2B API licensing).

---

**Q: What's your go-to-market strategy?**

> **Phase 1 (0–6 months)**: Direct outreach to 10–20 mid-market PE funds' in-house legal teams. Offer free pilot. Get 3–5 paid pilot customers with feedback loop.
>
> **Phase 2 (6–18 months)**: Integration partnerships with virtual data room providers (Intralinks, Datasite) who already have the document flow in M&A transactions.
>
> **Phase 3 (18+ months)**: White-label offering for law firms (they brand it as their own due diligence tool).
>
> Customer acquisition cost will be high (legal industry is relationship-driven), but lifetime value of an enterprise contract ($24,000–$60,000/yr) justifies it.

---

**Q: Who are your competitors?**

> | Competitor | Approach | LexGuard's Edge |
> |---|---|---|
> | Kira Systems (acquired by Litera) | ML-based clause extraction, no risk scoring | We add RAG-based risk scoring + negotiation |
> | Luminance AI | Enterprise-only, expensive | We're accessible to mid-market |
> | Ironclad | Contract lifecycle focus, not due diligence | Different use case |
> | ChatGPT/Claude (DIY) | No structured output, hallucination-prone | We have structured JSON, RAG grounding, purpose-built |
>
> We're differentiated by: (1) risk scoring with deal-breaker auto-detection, (2) negotiation redline engine, (3) confidence scoring, (4) affordable entry price point.

---

## 9. INNOVATION & DIFFERENTIATION

---

**Q: What's technically novel about this project?**

> 1. **Four-pillar risk taxonomy**: Specifically targeting the 4 clause types that dominate M&A risk (liability caps, termination triggers, non-compete scope, indemnity obligations) with specialized retrieval queries for each — rather than generic "clause extraction."
>
> 2. **Hybrid clause extraction**: LLM-first (Gemini Flash understands malformed/scanned clause structures) with heuristic regex fallback (section number patterns `7.2`, `Article 5`) — more robust than pure regex or pure LLM approaches.
>
> 3. **Confidence scoring system**: Dynamically calculates analysis reliability (0–100) based on FAISS similarity score distribution — tells users when to trust the result less.
>
> 4. **Error-resilient JSON parsing**: 5-stage fallback extraction (```json block → bare ``` block → outermost `{}` → full response → per-field regex) handles LLM output variance gracefully.
>
> 5. **Model orchestration**: Different Gemini models for different subtasks (2.5-Flash for quality, 2.0-Flash-Lite for speed, text-embedding-001 for vectors) — optimizing cost/quality per operation.

---

**Q: How is this better than just uploading the PDF to ChatGPT?**

> | Dimension | ChatGPT Upload | LexGuard AI |
> |---|---|---|
> | Context limit | ~128k tokens (whole doc may not fit) | RAG retrieves relevant chunks only |
> | Hallucination | Can invent clauses | RAG-grounded, only retrieved text used |
> | Output structure | Free-form text | Strict JSON → structured UI with risk scores |
> | Confidence | None | Per-analysis confidence score |
> | Action | Read-only | Negotiation redlines + PDF report |
> | History | None | All analyses stored, comparable |
> | Multi-user | No | User accounts, team sharing |
> | Reproducibility | Different every time | temperature=0.1 → near-deterministic |

---

## 10. ETHICAL & LEGAL CONSIDERATIONS

---

**Q: Can users rely on this for actual legal decisions?**

> **No, and we make this explicit.** LexGuard AI is positioned as a research and screening tool, not a substitute for qualified legal advice. Every report is watermarked "CONFIDENTIAL & PRIVILEGED — FOR ATTORNEY REVIEW ONLY."
>
> The system surfaces clauses for human lawyers to review — it reduces the time spent finding what to look at, not the time spent deciding what it means legally.

---

**Q: What if the AI misses a critical risk clause?**

> This is the highest-stakes failure mode. Our mitigations:
> 1. The system reports a `confidence_score` — low confidence = "get a lawyer to review this more carefully"
> 2. Fallback to raw text when FAISS retrieval is weak
> 3. System prompt instructs: "If you are uncertain, flag it as uncertain rather than omitting it"
>
> Ultimately: we cannot guarantee zero false negatives, which is why the product is explicitly "AI-assisted" not "AI-decided."

---

**Q: What about bias in the AI's risk assessments?**

> Gemini's training data likely over-represents common-law (US/UK) legal standards. For cross-border M&A (e.g., Indian law, civil law jurisdictions), the model may apply incorrect market-standard benchmarks.
>
> Mitigation: system prompt specifies "market standard" flags should be noted with jurisdiction context. Full mitigation requires fine-tuning on jurisdiction-specific legal datasets — on the research roadmap.

---

**Q: Does sending documents to Google Gemini API create any legal privilege concerns?**

> Potentially yes. Attorney-client privilege may be waived if documents are shared with third-party services without appropriate protections. For enterprise clients (law firms, regulated funds), this requires:
> 1. A Data Processing Agreement with Google
> 2. Potentially a "common interest" agreement covering third-party AI processors
> 3. Clear client disclosure in engagement letters
>
> This is a known issue in LegalTech broadly and is being addressed by enterprise AI providers through private deployment models.

---

## 11. TEAM & EXECUTION

---

**Q: What did you build in the hackathon timeframe vs. what existed before?**

> Built during the hackathon:
> - Full RAG pipeline (embeddings, FAISS indexing, retrieval)
> - Risk analysis engine with 4-pillar taxonomy and deal-breaker detection
> - Negotiation engine with redline generation and feasibility assessment
> - PDF report generator (CONFIDENTIAL watermark, structured sections)
> - Complete React dashboard (6 panels: upload, risk, analytics, chat, reports, chat)
> - Supabase database schema + auth integration
> - Deployment pipeline (Render + Vercel)

---

**Q: What corners did you cut for the hackathon that you'd fix in production?**

> Honest list:
> 1. **FAISS isn't distributed** — works on one server, breaks with horizontal scaling
> 2. **No task queue** — long analyses run synchronously in the API request (risk of timeout)
> 3. **No rate limiting** — a malicious user could spam Gemini API calls on our credit
> 4. **Stub endpoints** — some API routes are scaffolded but not fully implemented (e.g., document delete, listed analyses)
> 5. **No automated tests** — test files exist but integration tests aren't passing in CI
> 6. **GDPR non-compliant** — no right-to-erasure flow, no consent management

---

**Q: If you had 3 more months, what would you build next?**

> **Priority 1**: Real-time collaborative analysis — multiple lawyers annotating the same document simultaneously (Supabase real-time subscriptions are already in the stack)
>
> **Priority 2**: Clause comparison across multiple documents — "How does this NDA's non-compete compare to the last 5 deals in our database?"
>
> **Priority 3**: Version tracking — upload v1 and v2 of a contract, AI highlights what changed and flags new risks introduced
>
> **Priority 4**: On-premise LLM option — swap Gemini for local Llama 3 for air-gapped enterprise deployments

---

## 12. FAILURE MODES & STRESS TESTING

---

**Q: What happens when the Gemini API is down or rate-limited?**

> Currently: the request fails with a 500 error. The user sees an error message.
>
> Production improvement: exponential backoff retry (3 attempts), graceful degradation to "Analysis temporarily unavailable — please retry in a few minutes," and a queued job system so requests aren't lost.

---

**Q: What if someone uploads a non-legal document (e.g., a photo PDF, a resume)?**

> The document type classifier (Gemini Flash, `generate_fast()`) would likely classify it as "other" or hallucinate a type. The clause extractor would find few meaningful sections. The risk analysis would return a low score with low confidence.
>
> Better handling: add a pre-check step — if extracted text is below a minimum threshold (e.g., <500 words) or document type is "other" with confidence < 50%, reject with a user-friendly message: "This doesn't appear to be a legal agreement."

---

**Q: What happens with a 500-page document?**

> PyMuPDF handles large PDFs efficiently (streaming page-by-page). The bottleneck would be the LLM clause extraction step (we pass only the first 15,000 characters for LLM-based extraction) — for very large documents, the heuristic regex fallback processes the full text.
>
> Embedding all clauses (potentially 500+ chunks) would require ~25 API calls in batches of 20. This adds ~30 seconds. Total analysis time: 60–120 seconds for a 500-page document — still acceptable for due diligence use cases.

---

**Q: What's your biggest technical risk?**

> **Gemini model deprecation or pricing change.** We're entirely dependent on one AI provider. If Google changes pricing or deprecates `gemini-2.5-flash`, our cost model changes.
>
> Mitigation: the `llm_client.py` module is the only file that imports `google.generativeai`. Swapping to Anthropic Claude or OpenAI GPT-4 requires changing ~50 lines in that file. The rest of the system is model-agnostic.

---

**Q: Have you tested with real M&A documents?**

> Yes — we tested with:
> 1. A sample SPA template from a public law library
> 2. A template shareholder agreement
> 3. A sample NDA from a public repository
>
> The system correctly identified liability caps, flagged broad MAC clauses, and extracted non-compete durations. We haven't tested with live deal documents (obviously — those are confidential), which means some edge cases from exotic clause structures may not be handled perfectly.

---

*LexGuard AI — making M&A due diligence faster, cheaper, and smarter.*
