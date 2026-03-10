import {
  FileText, ShieldAlert, Brain, TrendingUp, CheckCircle2,
  Clock, Upload, Search, BarChart3, Download, AlertTriangle,
  Zap, ArrowRight, Eye, Scale, Lock, RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";

/* ─────────────────── PIPELINE STEPS ─────────────────── */
const PIPELINE_STEPS = [
  { id: 1, icon: Upload,       label: "Document Ingestion",   desc: "PDF / DOCX uploaded & queued",        status: "done",    time: "0.3s" },
  { id: 2, icon: Search,       label: "Text Extraction",      desc: "OCR + NLP parsing all clauses",       status: "done",    time: "1.2s" },
  { id: 3, icon: Brain,        label: "AI Analysis",          desc: "Gemini LLM deepreads every section",  status: "done",    time: "4.7s" },
  { id: 4, icon: ShieldAlert,  label: "Risk Scoring",         desc: "Clauses scored across 5 dimensions",  status: "active",  time: "..." },
  { id: 5, icon: Scale,        label: "Compliance Check",     desc: "GDPR, SOX, FCPA cross-referenced",    status: "pending", time: "--" },
  { id: 6, icon: Download,     label: "Report Generation",    desc: "Structured PDF/DOCX report built",    status: "pending", time: "--" },
];

/* ─────────────────── ACTIVE CASES ─────────────────── */
const ACTIVE_CASES = [
  { id: "LG-2401", name: "Share_Purchase_Agreement_2024.pdf",   stage: "Risk Scoring",      progress: 68, risk: "high",   pages: 48, analyst: "AM" },
  { id: "LG-2402", name: "Regulatory_Compliance_Filing_Q4.pdf", stage: "Compliance Check",  progress: 82, risk: "medium", pages: 22, analyst: "AM" },
  { id: "LG-2403", name: "Shareholder_Rights_Agreement.docx",   stage: "AI Analysis",       progress: 41, risk: "low",    pages: 16, analyst: "AM" },
  { id: "LG-2404", name: "NDA_Template_v3_Final.pdf",           stage: "Text Extraction",   progress: 18, risk: "low",    pages: 9,  analyst: "AM" },
];

/* ─────────────────── ACTIVITY FEED ─────────────────── */
const ACTIVITY = [
  { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", text: "Risk analysis completed for Share_Purchase_Agreement_2024.pdf",    time: "2 min ago" },
  { icon: AlertTriangle,color: "text-amber-500",   bg: "bg-amber-500/10",   text: "3 high-risk clauses flagged in LG-2401 — review required",           time: "4 min ago" },
  { icon: Upload,       color: "text-blue-500",    bg: "bg-blue-500/10",    text: "NDA_Template_v3_Final.pdf uploaded and queued for analysis",          time: "9 min ago" },
  { icon: Download,     color: "text-purple-500",  bg: "bg-purple-500/10",  text: "Compliance report generated for Regulatory_Compliance_Filing_Q4.pdf", time: "15 min ago" },
  { icon: Brain,        color: "text-indigo-500",  bg: "bg-indigo-500/10",  text: "AI re-analysis triggered for Shareholder_Rights_Agreement.docx",      time: "22 min ago" },
  { icon: Lock,         color: "text-rose-500",    bg: "bg-rose-500/10",    text: "GDPR Art. 28 violation detected in data processing addendum",          time: "31 min ago" },
];

/* ─────────────────── COMPLIANCE BARS ─────────────────── */
const COMPLIANCE = [
  { label: "GDPR",  score: 61, color: "bg-amber-500" },
  { label: "SOX",   score: 78, color: "bg-blue-500" },
  { label: "FCPA",  score: 55, color: "bg-rose-500" },
  { label: "HIPAA", score: 90, color: "bg-emerald-500" },
  { label: "CCPA",  score: 83, color: "bg-purple-500" },
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
  const [activeStep, setActiveStep] = useState(4);
  const [tick, setTick] = useState(0);

  /* Simulate pipeline progress */
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-6">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText}    label="Total Documents"   value="24"    sub="+3 this week"       color="bg-blue-500" />
        <StatCard icon={Brain}       label="AI Analyses Run"   value="18"    sub="94.2% avg accuracy" color="bg-indigo-500" />
        <StatCard icon={ShieldAlert} label="Risk Flags"        value="11"    sub="5 high · 6 medium"  color="bg-rose-500" />
        <StatCard icon={TrendingUp}  label="Compliance Score"  value="73%"   sub="↑ 4% vs last month" color="bg-emerald-500" />
      </div>

      {/* ── AI PIPELINE ── */}
      <div className="card-glass p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
              <Zap size={15} className="text-amber-500" /> AI Analysis Pipeline
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live workflow · Share_Purchase_Agreement_2024.pdf
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <RefreshCw size={11} className="animate-spin" /> Processing
          </div>
        </div>

        {/* Step row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0">
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isDone    = step.status === "done";
            const isActive  = step.status === "active";
            const isPending = step.status === "pending";
            return (
              <div key={step.id} className="flex sm:flex-col items-center sm:flex-1 group">
                {/* Step block */}
                <div
                  className={`w-full sm:flex-1 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 p-3 sm:p-3 rounded-xl border transition-all
                    ${isDone    ? "bg-emerald-500/8 border-emerald-500/25"  : ""}
                    ${isActive  ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]" : ""}
                    ${isPending ? "bg-muted/30 border-border/50"            : ""}
                  `}
                  onClick={() => setActiveStep(step.id)}
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
                    <p className={`text-[10px] font-mono mt-1
                      ${isDone   ? "text-emerald-500" : "text-muted-foreground/40"}
                    `}>{step.time}</p>
                  </div>
                  {isDone && <CheckCircle2 size={13} className="text-emerald-500 shrink-0 hidden sm:block" />}
                </div>
                {/* Arrow connector */}
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

        {/* Active cases */}
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

          <div className="flex flex-col gap-3">
            {ACTIVE_CASES.map((c) => (
              <div key={c.id} className="p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <FileText size={12} className="text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.id} · {c.pages} pages</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0
                    ${c.risk === "high"   ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"    : ""}
                    ${c.risk === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : ""}
                    ${c.risk === "low"    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : ""}
                  `}>{c.risk} risk</span>
                </div>
                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000
                        ${c.risk === "high"   ? "bg-gradient-to-r from-rose-500 to-orange-400"    : ""}
                        ${c.risk === "medium" ? "bg-gradient-to-r from-amber-500 to-yellow-400"   : ""}
                        ${c.risk === "low"    ? "bg-gradient-to-r from-indigo-500 to-blue-400"    : ""}
                      `}
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{c.progress}%</span>
                  <span className="text-[10px] text-indigo-400 font-medium">{c.stage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2 card-glass p-5 flex flex-col gap-4">
          <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
            <Eye size={14} className="text-purple-400" /> Live Activity
          </h2>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[340px] pr-1">
            {ACTIVITY.map((a, i) => {
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
        </div>
      </div>

      {/* ── COMPLIANCE + QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Compliance overview */}
        <div className="card-glass p-5 flex flex-col gap-4">
          <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
            <Scale size={14} className="text-blue-400" /> Compliance Overview
          </h2>
          <div className="flex flex-col gap-3">
            {COMPLIANCE.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold text-muted-foreground w-10">{c.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.color} transition-all duration-1000`}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
                <span className={`text-xs font-bold w-8 text-right
                  ${c.score >= 80 ? "text-emerald-500" : c.score >= 65 ? "text-amber-500" : "text-rose-500"}
                `}>{c.score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card-glass p-5 flex flex-col gap-4">
          <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
            <Zap size={14} className="text-amber-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
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
      </div>

    </div>
  );
}
