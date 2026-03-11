import { ShieldAlert, Brain, AlertTriangle, BookOpen, TrendingUp, ExternalLink, Loader2, FileText } from "lucide-react";
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis";
import { useDocuments } from "@/hooks/useDocuments";

function RiskMeter({ score }: { score: number }) {
  const color = score >= 70 ? "hsl(var(--danger))" : score >= 40 ? "hsl(var(--warning))" : "hsl(var(--success))";
  const label = score >= 70 ? "High Risk" : score >= 40 ? "Medium Risk" : "Low Risk";
  const circumference = 2 * Math.PI * 38;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="38" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="38" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}60)`, transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold" style={{ color }}>{score}%</span>
          <span className="text-xs text-muted-foreground">Risk</span>
        </div>
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${color}18`, color }}>{label}</span>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  if (risk === "high") return <span className="risk-badge-high">High</span>;
  if (risk === "medium") return <span className="risk-badge-medium">Medium</span>;
  return <span className="risk-badge-low">Low</span>;
}

export function RiskAnalysis() {
  const { analyses, clauses, loading, error } = useRiskAnalysis();
  const { documents } = useDocuments();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p className="text-sm">Loading risk analyses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertTriangle size={32} className="mb-3 text-amber-500" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-display font-semibold text-foreground text-base">AI Risk Analysis</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Upload and analyze documents to see risk findings</p>
        </div>
        <div className="card-glass p-12 flex flex-col items-center justify-center text-center">
          <ShieldAlert size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Risk Analyses Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Upload legal documents through the Documents section and run AI analysis to see risk scores, flagged clauses, and compliance warnings here.
          </p>
        </div>
      </div>
    );
  }

  const latest = analyses[0];
  const latestClauses = clauses.filter(c => c.risk_analysis_id === latest.id);
  const doc = documents.find(d => d.id === latest.document_id);
  const highClauses = latestClauses.filter(c => c.risk_level === "high").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-foreground text-base">AI Risk Analysis</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doc?.file_name ?? "Document"} · Analyzed {new Date(latest.analyzed_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-accent text-accent-foreground px-2.5 py-1.5 rounded-lg font-medium">
          <Brain size={12} />
          Gemini AI
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-glass p-5 flex flex-col items-center justify-center gap-3 md:col-span-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overall Risk Score</p>
          <RiskMeter score={latest.overall_risk_score} />
          <div className="grid grid-cols-3 gap-2 w-full">
            {[
              { label: "Clauses", val: String(latestClauses.length) },
              { label: "High", val: String(highClauses) },
              { label: "Pages", val: doc?.pages ? String(doc.pages) : "--" },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold text-foreground">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass p-5 md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={15} style={{ color: "hsl(var(--primary))" }} />
            <span className="text-sm font-semibold text-foreground">AI-Generated Summary</span>
          </div>
          {latest.ai_summary ? (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{latest.ai_summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No AI summary available for this analysis.</p>
          )}
          {latest.confidence_score && (
            <div className="flex items-center gap-2 mt-auto">
              <TrendingUp size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Confidence: <span className="font-semibold text-foreground">{latest.confidence_score}%</span> · {latestClauses.length} clauses analyzed
              </span>
            </div>
          )}
        </div>
      </div>

      {latestClauses.length > 0 && (
        <div className="card-glass p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={15} style={{ color: "hsl(var(--danger))" }} />
            <span className="text-sm font-semibold text-foreground">Detected Risky Clauses ({latestClauses.length})</span>
          </div>
          <div className="flex flex-col gap-2">
            {latestClauses.map((clause) => (
              <div key={clause.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors group">
                <div className="w-12 shrink-0 text-center">
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-accent text-accent-foreground">§{clause.clause_reference}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{clause.clause_title}</span>
                    <RiskBadge risk={clause.risk_level} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{clause.description}</p>
                  {clause.recommendation && (
                    <p className="text-xs text-indigo-400 mt-1 leading-relaxed">Recommendation: {clause.recommendation}</p>
                  )}
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary shrink-0">
                  <ExternalLink size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {analyses.length > 1 && (
        <div className="card-glass p-5 flex flex-col gap-3">
          <span className="text-sm font-semibold text-foreground">Previous Analyses</span>
          <div className="flex flex-col gap-2">
            {analyses.slice(1).map((a) => {
              const aDoc = documents.find(d => d.id === a.document_id);
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <FileText size={14} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{aDoc?.file_name ?? "Document"}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(a.analyzed_at).toLocaleString()}</p>
                  </div>
                  <RiskBadge risk={a.risk_level} />
                  <span className="text-xs font-bold text-foreground">{a.overall_risk_score}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
