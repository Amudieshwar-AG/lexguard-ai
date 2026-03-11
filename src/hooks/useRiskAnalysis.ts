import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL, API_PREFIX } from "@/config/api";
import type { Document } from "@/hooks/useDocuments";

export interface RiskAnalysis {
  id: string;
  document_id: string;
  user_id: string;
  overall_risk_score: number;
  risk_level: "low" | "medium" | "high";
  ai_summary: string | null;
  confidence_score: number | null;
  status: string;
  analyzed_at: string;
  created_at: string;
}

export interface RiskClause {
  id: string;
  risk_analysis_id: string;
  clause_reference: string;
  clause_title: string;
  risk_level: "low" | "medium" | "high";
  description: string;
  recommendation: string | null;
  created_at: string;
}

export function useRiskAnalysis(documentId?: string) {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<RiskAnalysis[]>([]);
  const [clauses, setClauses] = useState<RiskClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null); // doc id being analyzed
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchAnalyses();
  }, [user?.id, documentId]);

  async function fetchAnalyses() {
    if (!user?.id) return;

    try {
      let query = supabase
        .from('risk_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data, error: analysesError } = await query;
      if (analysesError) throw analysesError;

      setAnalyses(data || []);

      if (data && data.length > 0) {
        const analysisIds = data.map(a => a.id);
        const { data: clausesData, error: clausesError } = await supabase
          .from('risk_clauses')
          .select('*')
          .in('risk_analysis_id', analysisIds)
          .order('risk_level', { ascending: false });

        if (clausesError) throw clausesError;
        setClauses(clausesData || []);
      } else {
        setClauses([]);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk analyses');
    } finally {
      setLoading(false);
    }
  }

  function toErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
    return String(err);
  }

  async function triggerAnalysis(doc: Document): Promise<void> {
    if (!user?.id) throw new Error('User not authenticated');

    // Guard: reject if backend URL is localhost while running on a deployed HTTPS site
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.includes('localhost')) {
      throw new Error(
        'Backend URL not configured. Add VITE_API_URL=https://lexguard-ai.onrender.com to your Vercel environment variables and redeploy.'
      );
    }

    setAnalyzing(doc.id);
    try {
      // 1. Download file from Supabase Storage
      const { data: fileBlob, error: dlErr } = await supabase.storage
        .from('documents')
        .download(doc.file_path);
      if (dlErr) throw new Error(`Storage download failed: ${toErrorMessage(dlErr)}`);
      if (!fileBlob) throw new Error('File not found in storage. Please re-upload the document.');

      // 2. Upload to backend for text extraction + FAISS indexing
      const safeType = (doc.file_type && typeof doc.file_type === 'string' && doc.file_type.trim())
        ? doc.file_type
        : 'application/octet-stream';
      const file = new File([fileBlob as BlobPart], doc.file_name || 'document', { type: safeType });
      const formData = new FormData();
      formData.append('file', file);

      let uploadData: { document_id: string; document_type: string };
      try {
        const uploadRes = await fetch(`${API_BASE_URL}${API_PREFIX}/documents/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          const errJson = await uploadRes.json().catch(() => ({})) as Record<string, unknown>;
          throw new Error(String(errJson.detail ?? `Backend upload failed (${uploadRes.status})`));
        }
        uploadData = await uploadRes.json() as { document_id: string; document_type: string };
      } catch (fetchErr) {
        const msg = toErrorMessage(fetchErr);
        if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('CORS')) {
          throw new Error(
            'Cannot reach the backend. The Render service may be starting up (takes ~30s). Please wait and try again, or check that VITE_API_URL is set correctly in Vercel.'
          );
        }
        throw fetchErr;
      }

      const { document_id: backendDocId, document_type } = uploadData;

      // 3. Run AI risk analysis
      const analysisRes = await fetch(`${API_BASE_URL}${API_PREFIX}/analysis/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: backendDocId, document_type }),
      });
      if (!analysisRes.ok) {
        const errJson = await analysisRes.json().catch(() => ({})) as Record<string, unknown>;
        if (analysisRes.status === 429) {
          throw new Error('Gemini API rate limit reached. Please wait 60 seconds and try again.');
        }
        throw new Error(String(errJson.detail ?? `Analysis failed (${analysisRes.status})`));
      }
      const analysis = await analysisRes.json() as Record<string, unknown>;

      // 4. Save risk_analysis record to Supabase
      const { data: raData, error: raErr } = await supabase
        .from('risk_analyses')
        .insert({
          document_id: doc.id,
          user_id: user.id,
          overall_risk_score: (analysis.overall_risk_score as number) ?? 50,
          risk_level: (analysis.risk_level as "low" | "medium" | "high") ?? 'medium',
          ai_summary: (analysis.ai_summary as string) ?? null,
          confidence_score: (analysis.confidence_score as number) ?? null,
          clause_summary: (analysis.clause_summary as Record<string, unknown>) ?? null,
          status: 'completed',
          analyzed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (raErr) throw new Error(`Failed to save analysis: ${toErrorMessage(raErr)}`);

      // 5. Save flagged clauses + deal-breakers
      const dealBreakers = ((analysis.deal_breakers as any[]) || []).map((db) => ({
        risk_analysis_id: raData.id,
        clause_reference: String(db?.clause ?? 'Deal-Breaker'),
        clause_title: 'Deal-Breaker',
        clause_type: db?.clause_type ?? null,
        risk_level: 'high' as const,
        description: String(db?.reason ?? ''),
        recommendation: 'Renegotiate or reject this clause before proceeding.',
      }));
      const flagged = ((analysis.flagged_clauses as any[]) || []).map((c) => ({
        risk_analysis_id: raData.id,
        clause_reference: String(c?.clause_reference ?? 'Unknown'),
        clause_title: String(c?.clause_title ?? 'Clause'),
        clause_type: c?.clause_type ?? null,
        risk_level: (c?.risk_level ?? 'medium') as "low" | "medium" | "high",
        description: String(c?.description ?? ''),
        recommendation: c?.recommendation ?? null,
      }));
      const allClauses = [...flagged, ...dealBreakers];
      if (allClauses.length > 0) {
        const { error: clauseErr } = await supabase.from('risk_clauses').insert(allClauses);
        if (clauseErr) throw new Error(`Failed to save clauses: ${toErrorMessage(clauseErr)}`);
      }

      // 6. Mark document as completed
      await supabase.from('documents').update({ status: 'completed' }).eq('id', doc.id);

      // 7. Auto-generate reports (full + summary) — failures here don't abort the analysis
      try {
        const reportAnalysis = {
          ...analysis,
          flagged_clauses: allClauses
            .filter((c) => c.clause_title !== 'Deal-Breaker')
            .map((c) => ({
              clause_reference: c.clause_reference,
              clause_title: c.clause_title,
              clause_type: c.clause_type,
              risk_level: c.risk_level,
              description: c.description,
              recommendation: c.recommendation,
            })),
          deal_breakers: dealBreakers.map((db) => ({
            clause: db.clause_reference,
            clause_type: db.clause_type,
            reason: db.description,
          })),
        };
        const documentMetadata = {
          document_type: document_type || 'contract',
          file_size: doc.file_size ? `${(doc.file_size / 1024).toFixed(2)} KB` : 'N/A',
          pages: doc.pages || 'N/A',
          upload_date: doc.created_at,
        };

        for (const reportType of ['full', 'summary'] as const) {
          const { data: reportRecord, error: reportInsertErr } = await supabase
            .from('reports')
            .insert({
              user_id: user.id,
              document_id: doc.id,
              report_type: reportType === 'summary' ? 'executive_summary' : 'full_due_diligence',
              status: 'generating',
            })
            .select()
            .single();

          if (reportInsertErr) {
            console.error(`Failed to create ${reportType} report record:`, reportInsertErr);
            continue;
          }

          try {
            const reportRes = await fetch(`${API_BASE_URL}${API_PREFIX}/reports/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                document_name: doc.file_name.replace(/\.(pdf|docx)$/i, ''),
                analysis: reportAnalysis,
                document_metadata: documentMetadata,
                report_type: reportType,
              }),
            });
            if (!reportRes.ok) throw new Error(`Report generation failed (${reportRes.status})`);
            const { filename } = await reportRes.json() as { filename: string; file_path: string };
            await supabase
              .from('reports')
              .update({ status: 'ready', file_path: filename, generated_at: new Date().toISOString() })
              .eq('id', reportRecord.id);
          } catch (reportErr) {
            console.error(`Failed to generate ${reportType} report:`, reportErr);
            await supabase.from('reports').update({ status: 'error' }).eq('id', reportRecord.id);
          }
        }
      } catch (reportErr) {
        console.error('Report auto-generation error:', reportErr);
      }

      // 8. Refresh analyses list
      await fetchAnalyses();
    } finally {
      setAnalyzing(null);
    }
  }

  return {
    analyses,
    clauses,
    loading,
    analyzing,
    error,
    triggerAnalysis,
    refetch: fetchAnalyses,
  };
}
