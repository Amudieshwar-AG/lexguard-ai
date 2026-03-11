import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

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

      // Fetch clauses if we have analyses
      if (data && data.length > 0) {
        const analysisIds = data.map(a => a.id);
        const { data: clausesData, error: clausesError } = await supabase
          .from('risk_clauses')
          .select('*')
          .in('risk_analysis_id', analysisIds)
          .order('risk_level', { ascending: false });

        if (clausesError) throw clausesError;
        setClauses(clausesData || []);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk analyses');
    } finally {
      setLoading(false);
    }
  }

  return {
    analyses,
    clauses,
    loading,
    error,
    refetch: fetchAnalyses,
  };
}
