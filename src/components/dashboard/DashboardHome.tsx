import {
  FileText, ShieldAlert, Brain, TrendingUp, CheckCircle2,
  Clock, Upload, Search, BarChart3, Download, AlertTriangle,
  Zap, ArrowRight, Eye, Scale, Lock, RefreshCw, Loader2, LayoutDashboard,
} from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis";
import { useReports } from "@/hooks/useReports";

/* ─────────────── PIPELINE STEPS (static template) ─────────────── */
const PIPELINE_STEPS = [
  { id: 1, icon: Upload,       label: "Document Ingestion",   desc: "PDF / DOCX uploaded & queued" },
  { id: 2, icon: Search,       label: "Text Extraction",      desc: "OCR + NLP parsing all clauses" },
  { id: 3, icon: Brain,        label: "AI Analysis",          desc: "Gemini LLM deep-reads every section" },
  { id: 4, icon: ShieldAlert,  label: "Risk Scoring",         desc: "Clauses scored across 5 dimensions" },
  { id: 5, icon: Scale,        label: "Compliance Check",     desc: "GDPR, SOX, FCPA cross-referenced" },
  { id: 6, icon: Download,     label: "Report Generation",    desc: "Structured PDF/DOCX report built" },
];

/* ─────────────── STAT CARD ─────────────── */
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="card-glass p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-display font-bold text-foreground leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

/* ─────────────── MAIN COMPONENT ─────────────── */
export function DashboardHome({ onSectionChange }: { onSectionChange: (id: string) => void }) {
  const { documents, loading: docsLoading } = useDocuments();
  const { analyses, clauses, loading: riskLoading } = useRiskAnalysis();
  const { reports, loading: reportsLoading } = useReports();

  const loading = docsLoading || riskLoading || reportsLoading;

  /* Compute real stats */
  const totalDocs = documents.length;
  const totalAnalyses = analyses.length;
  const highRiskClauses = clauses.filter(c => c.risk_level === "high").length;
  const medRiskClauses = clauses.filter(c => c.risk_level === "medium").length;
  const avgRisk = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.overall_risk_score, 0) / analyses.length)
    : 0;

  /* Derive pipeline step status from latest analysis */
  const latestAnalysis = analyses.length > 0
    ? analyses.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b))
    : null;

  function getPipelineStepStatus(stepId: number): "done" | "active" | "pending" {
    if (!latestAnalysis) return stepId === 1 && totalDocs > 0 ? "done" : "pending";
    const status = latestAnalysis.status;
    if (status === "completed") return "done";
    // If in progress — simulate partial pipeline
    if (status === "in_progress") {
      if (stepId <= 3) return "done";
      if (stepId === 4) return "active";
      return "pending";
    }
    if (stepId === 1) return totalDocs > 0 ? "done" : "pending";
    return "pending";
  }

  /* Build activity feed from real events */
  const activityItems: { icon: React.ElementType; color: string; bg: string; text: string; time: string }[] = [];

  // Recent documents
  documents.slice(0, 3).forEach(doc => {
    activityItems.push({
      icon: Upload,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      text: `${doc.file_name} uploaded`,
      time: new Date(doc.created_at).toLocaleString(),
    });
  });

  // Recent analyses
  analyses.slice(0, 3).forEach(a => {
    const doc = documents.find(d => d.id === a.document_id);
    activityItems.push({
      icon: a.status === "completed" ? CheckCircle2 : Brain,
      color: a.status === "completed" ? "text-emerald-500" : "text-indigo-500",
      bg: a.status === "completed" ? "bg-emerald-500/10" : "bg-indigo-500/10",
      text: `Risk analysis ${a.status} for ${doc?.file_name || "document"}`,
      time: new Date(a.created_at).toLocaleString(),
    });
  });

  // Risk flags
  if (highRiskClauses > 0) {
    activityItems.push({
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      text: `${highRiskClauses} high-risk clauses flagged — review required`,
      time: "Recent",
    });
  }

  // Recent reports
  reports.slice(0, 2).forEach(r => {
    activityItems.push({
      icon: Download,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      text: `Report generated: ${r.report_type?.replace(/_/g, " ") || "Report"}`,
      time: new Date(r.created_at).toLocaleString(),
    });
  });

  // Sort by time (most recent first)
  activityItems.sort((a, b) => {
    if (a.time === "Recent") return -1;
    if (b.time === "Recent") return 1;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p className="text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const hasData = totalDocs > 0 || totalAnalyses > 0 || reports.length > 0;

  return (
    <div className="flex flex-col gap-6">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText}    label="Total Documents"   value={String(totalDocs)}    sub={totalDocs === 0 ? "Upload to get started" : `${totalAnalyses} analyzed`} color="bg-blue-500" />
        <StatCard icon={Brain}       label="AI Analyses Run"   value={String(totalAnalyses)} sub={analyses.length > 0 ? `Avg score: ${avgRisk}%` : "None yet"} color="bg-indigo-500" />
        <StatCard icon={ShieldAlert} label="Risk Flags"        value={String(highRiskClauses + medRiskClauses)} sub={`${highRiskClauses} high · ${medRiskClauses} medium`} color="bg-rose-500" />
        <StatCard icon={TrendingUp}  label="Reports Generated" value={String(reports.length)} sub={reports.length > 0 ? "Ready for download" : "Generate your first"} color="bg-emerald-500" />
      </div>

      {!hasData && (
        <div className="card-glass p-12 flex flex-col items-center justify-center text-center">
          <LayoutDashboard size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to LexGuard AI</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Upload your first legal document to activate the AI analysis pipeline. Your dashboard will populate with real-time insights as data flows in.
          </p>
          <button onClick={() => onSectionChange("documents")} className="btn-primary text-sm">
            <Upload size={14} /> Upload Document
          </button>
        </div>
      )}

      {hasData && (
        <>
          {/* ── AI PIPELINE ── */}
          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
                  <Zap size={15} className="text-amber-500" /> AI Analysis Pipeline
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {latestAnalysis
                    ? `Latest: ${documents.find(d => d.id === latestAnalysis.document_id)?.file_name || "Document"}`
                    : "Pipeline status"}
                </p>
              </div>
              {latestAnalysis && latestAnalysis.status !== "completed" && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <RefreshCw size={11} className="animate-spin" /> Processing
                </div>
              )}
              {latestAnalysis && latestAnalysis.status === "completed" && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 size={11} /> Complete
                </div>
              )}
            </div>

            {/* Step row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0">
              {PIPELINE_STEPS.map((step, i) => {
                const Icon = step.icon;
                const stepStatus = getPipelineStepStatus(step.id);
                const isDone    = stepStatus === "done";
                const isActive  = stepStatus === "active";
                const isPending = stepStatus === "pending";
                return (
                  <div key={step.id} className="flex sm:flex-col items-center sm:flex-1 group">
                    <div
                      className={`w-full sm:flex-1 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 p-3 sm:p-3 rounded-xl border transition-all
                        ${isDone    ? "bg-emerald-500/8 border-emerald-500/25"  : ""}
                        ${isActive  ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]" : ""}
                        ${isPending ? "bg-muted/30 border-border/50"            : ""}
                      `}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                        ${isDone    ? "bg-emerald-500/15"  : ""}
                        ${isActive  ? "bg-indigo-500/20"   : ""}
                        ${isPending ? "bg-muted"            : ""}
                      `}>
                        <Icon size={16}
                          className={`
                            ${isDone    ? "text-emerald-500"    : ""}
                            ${isActive  ? "text-indigo-400"     : ""}
                            ${isPending ? "text-muted-foreground/50" : ""}
                            ${isActive  ? "animate-pulse"       : ""}
                          `}
                        />
                      </div>
                      <div className="flex-1 sm:text-center min-w-0">
                        <p className={`text-xs font-semibold leading-tight
                          ${isDone    ? "text-emerald-600" : ""}
                          ${isActive  ? "text-indigo-400"  : ""}
                          ${isPending ? "text-muted-foreground/50" : ""}
                        `}>{step.label}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 hidden sm:block leading-tight">{step.desc}</p>
                      </div>
                      {isDone && <CheckCircle2 size={13} className="text-emerald-500 shrink-0 hidden sm:block" />}
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <ArrowRight size={14}
                        className={`shrink-0 mx-2 rotate-90 sm:rotate-0
                          ${isDone ? "text-emerald-500/50" : "text-muted-foreground/20"}
                        `}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── ACTIVE CASES + ACTIVITY ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Active cases — from real documents + analyses */}
            <div className="lg:col-span-3 card-glass p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
                  <Clock size={14} className="text-indigo-400" /> Active Cases
                </h2>
                <button
                  onClick={() => onSectionChange("documents")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >View all <ArrowRight size={11} /></button>
              </div>

              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No documents uploaded yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {documents.slice(0, 5).map((doc) => {
                    const analysis = analyses.find(a => a.document_id === doc.id);
                    const docClauses = analysis ? clauses.filter(c => c.risk_analysis_id === analysis.id) : [];
                    const highCount = docClauses.filter(c => c.risk_level === "high").length;
                    const riskLabel = highCount > 0 ? "high" : docClauses.length > 0 ? "medium" : "low";
                    const progress = analysis
                      ? analysis.status === "completed" ? 100 : analysis.status === "in_progress" ? 55 : 10
                      : 0;
                    const stage = analysis
                      ? analysis.status === "completed" ? "Complete" : analysis.status === "in_progress" ? "Analyzing" : "Queued"
                      : "Awaiting Analysis";

                    return (
                      <div key={doc.id} className="p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                              <FileText size={12} className="text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{doc.file_name}</p>
                              <p className="text-[10px] text-muted-foreground">{doc.file_type?.toUpperCase() || "DOC"} · {new Date(doc.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0
                            ${riskLabel === "high"   ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"    : ""}
                            ${riskLabel === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : ""}
                            ${riskLabel === "low"    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : ""}
                          `}>{riskLabel} risk</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000
                                ${riskLabel === "high"   ? "bg-gradient-to-r from-rose-500 to-orange-400"    : ""}
                                ${riskLabel === "medium" ? "bg-gradient-to-r from-amber-500 to-yellow-400"   : ""}
                                ${riskLabel === "low"    ? "bg-gradient-to-r from-indigo-500 to-blue-400"    : ""}
                              `}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{progress}%</span>
                          <span className="text-[10px] text-indigo-400 font-medium">{stage}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity feed */}
            <div className="lg:col-span-2 card-glass p-5 flex flex-col gap-4">
              <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
                <Eye size={14} className="text-purple-400" /> Live Activity
              </h2>
              {activityItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[340px] pr-1">
                  {activityItems.slice(0, 8).map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${a.bg}`}>
                          <Icon size={12} className={a.color} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-foreground leading-snug">{a.text}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{a.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── QUICK ACTIONS ── */}
          <div className="card-glass p-5 flex flex-col gap-4">
            <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: Upload,      label: "Upload Document",     color: "hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400",    section: "documents" },
                { icon: ShieldAlert, label: "View Risk Report",    color: "hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400",    section: "risk" },
                { icon: BarChart3,   label: "Open Analytics",      color: "hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400", section: "analytics" },
                { icon: Brain,       label: "Ask AI Assistant",    color: "hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400", section: "chat" },
                { icon: Download,    label: "Download Reports",    color: "hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400", section: "reports" },
                { icon: Scale,       label: "Compliance Check",    color: "hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400",  section: "risk" },
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    onClick={() => onSectionChange(a.section)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border border-border bg-muted/20 text-muted-foreground text-xs font-medium transition-all ${a.color}`}
                  >
                    <Icon size={14} />
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
