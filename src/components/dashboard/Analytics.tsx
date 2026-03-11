import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Award, FileBarChart2, Loader2, BarChart3 } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis";

const RISK_COLORS = {
  high: "hsl(0 84% 60%)",
  medium: "hsl(38 92% 50%)",
  low: "hsl(142 71% 45%)",
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2.5 text-xs">
        {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.fill || entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function Analytics() {
  const { documents, loading: docsLoading } = useDocuments();
  const { analyses, clauses, loading: riskLoading } = useRiskAnalysis();

  const loading = docsLoading || riskLoading;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p className="text-sm">Loading analytics...</p>
      </div>
    );
  }

  const totalDocs = documents.length;
  const totalAnalyses = analyses.length;
  const highRiskCount = clauses.filter(c => c.risk_level === "high").length;
  const medRiskCount = clauses.filter(c => c.risk_level === "medium").length;
  const lowRiskCount = clauses.filter(c => c.risk_level === "low").length;
  const avgRisk = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.overall_risk_score, 0) / analyses.length)
    : 0;
  const avgConfidence = analyses.filter(a => a.confidence_score).length > 0
    ? Math.round(analyses.filter(a => a.confidence_score).reduce((sum, a) => sum + (a.confidence_score || 0), 0) / analyses.filter(a => a.confidence_score).length)
    : 0;

  // Build risk distribution for pie chart
  const riskDistData = [
    { name: "High Risk", value: highRiskCount, color: RISK_COLORS.high },
    { name: "Medium Risk", value: medRiskCount, color: RISK_COLORS.medium },
    { name: "Low Risk", value: lowRiskCount, color: RISK_COLORS.low },
  ].filter(d => d.value > 0);

  // Build per-analysis bar chart data
  const barData = analyses.slice(0, 8).map((a) => {
    const doc = documents.find(d => d.id === a.document_id);
    const aClauses = clauses.filter(c => c.risk_analysis_id === a.id);
    const shortName = doc?.file_name
      ? doc.file_name.replace(/\.(pdf|docx)$/i, "").slice(0, 15)
      : "Doc";
    return {
      name: shortName,
      score: a.overall_risk_score,
      clauses: aClauses.length,
    };
  });

  const hasData = totalDocs > 0 || totalAnalyses > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-display font-semibold text-foreground text-base">Analytics & Insights</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Visual analysis of AI risk findings across all documents</p>
        </div>
        <div className="card-glass p-12 flex flex-col items-center justify-center text-center">
          <BarChart3 size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Analytics Data Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Upload documents and run AI analyses to see charts, risk distribution, and compliance insights here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display font-semibold text-foreground text-base">Analytics & Insights</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Visual analysis of AI risk findings across all documents</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Documents Uploaded", value: String(totalDocs), sub: `${totalAnalyses} analyzed`, icon: FileBarChart2, color: "primary" },
          { label: "Average Risk Score", value: avgRisk > 0 ? `${avgRisk}%` : "--", sub: avgRisk >= 70 ? "High threshold" : avgRisk >= 40 ? "Medium threshold" : "Low threshold", icon: TrendingUp, color: avgRisk >= 70 ? "danger" : avgRisk >= 40 ? "warning" : "success" },
          { label: "Risk Flags", value: String(highRiskCount + medRiskCount), sub: `${highRiskCount} high · ${medRiskCount} medium`, icon: Award, color: "warning" },
          { label: "Avg Confidence", value: avgConfidence > 0 ? `${avgConfidence}%` : "--", sub: "AI accuracy", icon: Award, color: "success" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="stat-card animate-fade-in-up">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `hsl(var(--${kpi.color}) / 0.1)` }}>
                  <Icon size={15} style={{ color: `hsl(var(--${kpi.color}))` }} />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-foreground mt-1">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="card-glass p-5 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Risk Distribution</p>
            <p className="text-xs text-muted-foreground">Clause risk levels across all analyses</p>
          </div>
          {riskDistData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={riskDistData} cx="50%" cy="50%" innerRadius={48} outerRadius={80}
                    paddingAngle={3} dataKey="value" stroke="none">
                    {riskDistData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {riskDistData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-muted-foreground flex-1 leading-tight">{d.name}</span>
                    <span className="text-xs font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No clause data to display</p>
          )}
        </div>

        {/* Bar chart */}
        <div className="card-glass p-5 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Risk Scores by Document</p>
            <p className="text-xs text-muted-foreground">Per-document risk scores and clause counts</p>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barSize={9} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="score" name="Risk Score" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="clauses" name="Flagged Clauses" fill="hsl(var(--danger))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No analysis data to chart</p>
          )}
        </div>
      </div>
    </div>
  );
}
