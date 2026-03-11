import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL, API_PREFIX } from "@/config/api";

export interface Report {
  id: string;
  document_id: string;
  user_id: string;
  report_type: "full_due_diligence" | "executive_summary";
  file_path: string | null;
  file_size: number | null;
  status: "generating" | "ready" | "error";
  generated_at: string | null;
  created_at: string;
}

export function useReports(documentId?: string) {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchReports();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, documentId]);

  async function fetchReports() {
    if (!user?.id) return;

    try {
      let query = supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data, error: reportsError } = await query;
      if (reportsError) throw reportsError;

      setReports(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }

  async function generateReport(docId: string, reportType: Report['report_type']): Promise<Report> {
    if (!user?.id) throw new Error('User not authenticated');

    // 1. Fetch analysis from Supabase
    const { data: analysesData, error: aErr } = await supabase
      .from('risk_analyses')
      .select('*')
      .eq('document_id', docId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (aErr) throw aErr;
    if (!analysesData || analysesData.length === 0) {
      throw new Error('No analysis found. Run AI Risk Analysis on this document first.');
    }
    const analysis = analysesData[0];

    // 2. Fetch clauses for that analysis
    const { data: clausesData } = await supabase
      .from('risk_clauses')
      .select('*')
      .eq('risk_analysis_id', analysis.id);

    // 3. Fetch document metadata
    const { data: doc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .single();

    // 4. Create report record (status = generating)
    const { data: reportRecord, error: rErr } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        document_id: docId,
        report_type: reportType,
        status: 'generating',
      })
      .select()
      .single();
    if (rErr) throw rErr;

    try {
      // 5. Call backend to generate PDF
      const backendType = reportType === 'executive_summary' ? 'summary' : 'full';
      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_name: doc?.file_name?.replace(/\.(pdf|docx)$/i, '') || 'document',
          analysis: {
            ...analysis,
            flagged_clauses: (clausesData || []).map(c => ({
              clause_reference: c.clause_reference,
              clause_title: c.clause_title,
              risk_level: c.risk_level,
              description: c.description,
              recommendation: c.recommendation,
            })),
          },
          document_metadata: { page_count: doc?.pages ?? 0 },
          report_type: backendType,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Report generation failed (${res.status})`);
      }
      const { filename } = await res.json();

      // 6. Update report record to ready
      const { data: updated, error: uErr } = await supabase
        .from('reports')
        .update({
          status: 'ready',
          file_path: filename,
          generated_at: new Date().toISOString(),
        })
        .eq('id', reportRecord.id)
        .select()
        .single();
      if (uErr) throw uErr;
      return updated;
    } catch (err) {
      await supabase.from('reports').update({ status: 'error' }).eq('id', reportRecord.id);
      throw err;
    }
  }

  async function downloadReport(report: Report): Promise<void> {
    if (!user?.id) throw new Error('User not authenticated');

    // Fetch analysis + clauses from Supabase to regenerate on demand
    const { data: analysesData, error: aErr } = await supabase
      .from('risk_analyses')
      .select('*')
      .eq('document_id', report.document_id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (aErr || !analysesData || analysesData.length === 0) {
      throw new Error('No analysis found for this document. Run Risk Analysis first.');
    }
    const analysis = analysesData[0];

    const { data: clausesData } = await supabase
      .from('risk_clauses')
      .select('*')
      .eq('risk_analysis_id', analysis.id);

    const { data: doc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', report.document_id)
      .single();

    const backendType = report.report_type === 'executive_summary' ? 'summary' : 'full';
    const docName = doc?.file_name?.replace(/\.(pdf|docx)$/i, '') || 'document';

    const res = await fetch(`${API_BASE_URL}${API_PREFIX}/reports/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_name: docName,
        analysis: {
          ...analysis,
          flagged_clauses: (clausesData || []).map(c => ({
            clause_reference: c.clause_reference,
            clause_title: c.clause_title,
            risk_level: c.risk_level,
            description: c.description,
            recommendation: c.recommendation,
          })),
        },
        document_metadata: { page_count: doc?.pages ?? 0 },
        report_type: backendType,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error(String(err.detail ?? `Download failed (${res.status})`));
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = backendType === 'summary'
      ? `LexGuard_Summary_${docName}.pdf`
      : `LexGuard_Report_${docName}.pdf`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    reports,
    loading,
    error,
    generateReport,
    downloadReport,
    refetch: fetchReports,
  };
}
