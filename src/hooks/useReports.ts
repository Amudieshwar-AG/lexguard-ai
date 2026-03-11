import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Report {
  id: string;
  document_id: string;
  user_id: string;
  report_type: "full_diligence" | "executive_summary" | "compliance_checklist" | "clause_redline";
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

  async function generateReport(documentId: string, reportType: Report['report_type']): Promise<Report | null> {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          document_id: documentId,
          report_type: reportType,
          status: 'generating',
        })
        .select()
        .single();

      if (error) throw error;

      // In production, trigger Edge Function to generate report
      // For now, simulate report generation
      setTimeout(async () => {
        await supabase
          .from('reports')
          .update({
            status: 'ready',
            generated_at: new Date().toISOString(),
            file_size: Math.floor(Math.random() * 3000000) + 500000,
          })
          .eq('id', data.id);
      }, 5000);

      return data;
    } catch (err) {
      console.error('Generate report error:', err);
      return null;
    }
  }

 async function downloadReport(report: Report): Promise<void> {
    if (!report.file_path) {
      alert('Report file not ready yet');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('reports')
        .download(report.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.report_type}_${report.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download report');
    }
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
