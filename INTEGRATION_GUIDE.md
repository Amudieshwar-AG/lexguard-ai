# LexGuard AI — Frontend-Backend Integration Guide

This guide shows how to connect your React frontend to the FastAPI backend.

---

## 🔌 Architecture Overview

```
React Frontend (port 5173)
         ↓ HTTP requests
FastAPI Backend (port 8000)
         ↓
    ┌────────┴────────┐
    ↓                 ↓
Gemini API      Supabase DB
```

**Data Flow:**
1. User uploads file in React → POST `/api/v1/documents/upload`
2. Backend processes → stores in Supabase → returns document_id
3. Frontend triggers analysis → POST `/api/v1/analysis/analyze`
4. Backend runs Gemini AI → stores results → returns JSON
5. Frontend fetches results → displays in dashboard

---

## 🚀 Quick Setup

### Step 1: Start Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your GEMINI_API_KEY and SUPABASE_SERVICE_KEY
uvicorn main:app --reload --port 8000uvicorn main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**

### Step 2: Update Frontend API URLs

Create `src/config/api.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const API_PREFIX = "/api/v1";

export const ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}${API_PREFIX}/documents/upload`,
  ANALYZE: `${API_BASE_URL}${API_PREFIX}/analysis/analyze`,
  REPORTS: `${API_BASE_URL}${API_PREFIX}/reports`,
  CHAT: `${API_BASE_URL}${API_PREFIX}/chat/message`,
  NEGOTIATION: `${API_BASE_URL}${API_PREFIX}/negotiation`,
};
```

Add to `.env`:
```
VITE_API_URL=http://localhost:8000
```

---

## 📦 Update React Hooks

### 1. Update `useDocuments.ts` to call backend upload

```typescript
// src/hooks/useDocuments.ts
import { ENDPOINTS } from "@/config/api";

async function uploadDocument(file: File) {
  setLoading(true);
  setError(null);

  try {
    // ── STEP 1: Upload to FastAPI backend ──────────────────────────
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(ENDPOINTS.UPLOAD, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Upload failed");
    }

    const backendData = await response.json();
    // backendData = { document_id, filename, document_type, clause_count, ... }

    // ── STEP 2: Store in Supabase for frontend access ─────────────
    const { data: uploadData, error: storageError } = await supabase.storage
      .from("documents")
      .upload(`${user!.id}/${file.name}`, file);

    if (storageError) throw storageError;

    const { data: dbData, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: user!.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: uploadData.path,
        document_type: backendData.document_type,
        clause_count: backendData.clause_count,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // ── STEP 3: Trigger AI analysis ────────────────────────────────
    const analysisResponse = await fetch(ENDPOINTS.ANALYZE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_id: backendData.document_id,
        document_type: backendData.document_type,
      }),
    });

    if (!analysisResponse.ok) {
      console.error("Analysis failed, but document stored");
    } else {
      const analysisData = await analysisResponse.json();

      // Store analysis in Supabase
      await supabase.from("risk_analyses").insert({
        document_id: dbData.id,
        user_id: user!.id,
        overall_risk_score: analysisData.overall_risk_score,
        risk_level: analysisData.risk_level,
        ai_summary: analysisData.ai_summary,
        confidence_score: analysisData.confidence_score,
        status: "completed",
        analyzed_at: new Date().toISOString(),
      });

      // Store flagged clauses
      if (analysisData.flagged_clauses?.length > 0) {
        const { data: analysisRecord } = await supabase
          .from("risk_analyses")
          .select("id")
          .eq("document_id", dbData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (analysisRecord) {
          const clauseInserts = analysisData.flagged_clauses.map((c: any) => ({
            risk_analysis_id: analysisRecord.id,
            clause_reference: c.clause_reference,
            clause_title: c.clause_title,
            risk_level: c.risk_level,
            description: c.description,
            recommendation: c.recommendation,
          }));

          await supabase.from("risk_clauses").insert(clauseInserts);
        }
      }
    }

    await fetchDocuments();
    return dbData;
  } catch (err) {
    setError(err instanceof Error ? err.message : "Upload failed");
    throw err;
  } finally {
    setLoading(false);
  }
}
```

---

### 2. Update `useRiskAnalysis.ts` (already reads from Supabase)

**No changes needed!** The hook already fetches from Supabase. The backend writes to Supabase during upload.

---

### 3. Update `useReports.ts` to call backend

```typescript
// src/hooks/useReports.ts
import { ENDPOINTS } from "@/config/api";

async function generateReport(docId: string, type: string) {
  setLoading(true);
  setError(null);

  try {
    // Fetch document + analysis data
    const { data: doc } = await supabase
      .from("documents")
      .select("*")
      .eq("id", docId)
      .single();

    const { data: analysis } = await supabase
      .from("risk_analyses")
      .select("*, risk_clauses(*)")
      .eq("document_id", docId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!doc || !analysis) {
      throw new Error("Document or analysis not found");
    }

    // ── Call backend report generator ──────────────────────────────
    const response = await fetch(`${ENDPOINTS.REPORTS}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_name: doc.file_name,
        analysis: {
          overall_risk_score: analysis.overall_risk_score,
          risk_level: analysis.risk_level,
          ai_summary: analysis.ai_summary,
          flagged_clauses: analysis.risk_clauses,
          deal_breakers: [], // add if you track these separately
        },
        document_metadata: {
          page_count: doc.page_count,
          file_size_mb: (doc.file_size / (1024 * 1024)).toFixed(2),
        },
        report_type: type === "executive_summary" ? "summary" : "full",
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Report generation failed");
    }

    const backendData = await response.json();

    // Store report record in Supabase
    const { data: report } = await supabase
      .from("reports")
      .insert({
        document_id: docId,
        user_id: user!.id,
        report_type: type,
        file_path: backendData.file_path,
        format: "pdf",
        status: "completed",
      })
      .select()
      .single();

    await fetchReports();
    return report;
  } catch (err) {
    setError(err instanceof Error ? err.message : "Report generation failed");
    throw err;
  } finally {
    setLoading(false);
  }
}

async function downloadReport(report: Report) {
  try {
    // Download from backend
    const url = `${ENDPOINTS.REPORTS}/download/${report.file_path.split("/").pop()}`;
    window.open(url, "_blank");
  } catch (err) {
    console.error("Download failed:", err);
  }
}
```

---

### 4. Create Chat Hook

Create `src/hooks/useChat.ts`:

```typescript
import { useState } from "react";
import { ENDPOINTS } from "@/config/api";

interface Message {
  role: "user" | "model";
  content: string;
}

export function useChat(documentId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(userMessage: string) {
    setLoading(true);
    setError(null);

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await fetch(ENDPOINTS.CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          messages: newMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();

      setMessages([
        ...newMessages,
        { role: "model", content: data.response },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  return { messages, sendMessage, loading, error };
}
```

---

### 5. Update ChatBot component

```typescript
// src/components/dashboard/ChatBot.tsx
import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useDocuments } from "@/hooks/useDocuments";

export function ChatBot() {
  const { documents } = useDocuments();
  const latestDoc = documents[0]; // or let user select
  const { messages, sendMessage, loading } = useChat(latestDoc?.id || "");
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && latestDoc) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === "user" ? "bg-primary text-white" : "bg-muted"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-muted-foreground">AI is thinking...</div>}
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about the document..."
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button onClick={handleSend} className="btn-primary">Send</button>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing the Integration

### 1. Test Document Upload

```bash
# Terminal 1: Start backend
cd backend
uvicorn main:app --reload

# Terminal 2: Start frontend
cd ..
npm run dev
```

1. Go to http://localhost:5173
2. Login
3. Upload a PDF (e.g., a sample share purchase agreement)
4. Watch console for:
   - POST to FastAPI `/documents/upload`
   - POST to FastAPI `/analysis/analyze`
   - Supabase inserts

### 2. Test Risk Analysis Display

1. Navigate to "Risk Analysis" tab
2. Should see:
   - Risk score from backend
   - AI summary from Gemini
   - Flagged clauses with recommendations
   - Deal-breakers

### 3. Test Report Generation

1. Navigate to "Reports" tab
2. Click "Generate New Report"
3. Backend should:
   - Build PDF with ReportLab
   - Save to `/backend/reports/generated_reports/`
   - Return download URL
4. Click "Download" → PDF opens

### 4. Test Chat

1. Navigate to "Chat" tab
2. Ask: "What's the indemnity cap?"
3. Backend should:
   - Use RAG to find relevant clauses
   - Send to Gemini with context
   - Return grounded answer

---

## 🔐 Authentication Flow

**Current:** Supabase JWT auth (frontend only)

**Recommended for production:**

1. Frontend gets Supabase JWT after login
2. Frontend sends JWT in `Authorization: Bearer <token>` header
3. Backend validates JWT using Supabase service key
4. Backend extracts `user_id` from JWT
5. Backend uses `user_id` for all DB operations

**Implementation:**

```python
# backend/utils/auth.py
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from supabase import Client

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    supabase: Client = Depends(get_supabase_client),
):
    token = credentials.credentials
    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
```

Then add to routes:
```python
@router.post("/upload")
async def upload_document(
    file: UploadFile,
    current_user = Depends(get_current_user),
):
    # Use current_user.id for user_id
```

---

## 📊 Error Handling

### Backend Errors

Backend returns structured errors:
```json
{
  "detail": "Document not found"
}
```

Frontend should catch:
```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Request failed");
  }
} catch (err) {
  setError(err.message);
}
```

---

## 🚀 Production Checklist

- [ ] Set `CORS_ORIGINS` in backend `.env` to production frontend URL
- [ ] Deploy backend to Railway/Render/AWS
- [ ] Update `VITE_API_URL` in frontend `.env` to production backend URL
- [ ] Enable Supabase Row Level Security for user isolation
- [ ] Add JWT validation in backend routes
- [ ] Add rate limiting (FastAPI Limiter)
- [ ] Add logging (FastAPI + Supabase logs)
- [ ] Monitor Gemini API quota

---

## 💡 Tips

1. **Development:** Run both frontend and backend locally
2. **Debugging:** Check FastAPI logs (`uvicorn` output) and `http://localhost:8000/docs`
3. **CORS Issues:** Ensure `CORS_ORIGINS` includes `http://localhost:5173`
4. **Gemini API:** Free tier = 60 requests/minute. Monitor usage.
5. **FAISS Index:** Gets rebuilt per document. Persists in `/backend/vector_store/faiss_index/`

---

## 🤝 Support

Issues? Check:
- Backend logs: Terminal running `uvicorn`
- Frontend errors: Browser console (F12)
- API testing: Swagger UI at `http://localhost:8000/docs`
- Supabase logs: Supabase Dashboard → Logs
