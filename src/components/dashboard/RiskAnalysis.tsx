import { ShieldAlert, Brain, AlertTriangle, BookOpen, TrendingUp, ExternalLink } from "lucide-react";

const RISK_SCORE = 73;

const RISKY_CLAUSES = [
  { id: "5.2", title: "Change of Control Provision", risk: "high", description: "Clause triggers automatic termination without notice period upon ownership transfer exceeding 25%." },
  { id: "8.1", title: "Liability Cap Limitation", risk: "high", description: "Caps total liability at 12-month contract value, excluding consequential damages entirely." },
  { id: "12.4", title: "Non-Compete Duration", risk: "medium", description: "3-year non-compete clause exceeds typical 12-18 month enforceability threshold in multiple jurisdictions." },
  { id: "15.7", title: "Arbitration Venue", risk: "medium", description: "Mandatory arbitration in Singapore may limit access to local courts for EU-based parties." },
  { id: "3.9", title: "IP Assignment Scope", risk: "low", description: "Broad IP assignment includes pre-existing IP developed outside contract scope — requires carve-out." },
];

const COMPLIANCE_WARNINGS = [
  { code: "GDPR Art. 28", description: "Data processing addendum required for cross-border data transfers to non-EEA countries." },
  { code: "SOX § 302", description: "Financial representations in Section 4.2 lack required CEO/CFO certification language." },
  { code: "FCPA Compliance", description: "Anti-bribery representations in Exhibit B are insufficient for jurisdictions covered." },
];

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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-foreground text-base">AI Risk Analysis</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Share_Purchase_Agreement_2024.pdf · Analyzed just now</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-accent text-accent-foreground px-2.5 py-1.5 rounded-lg font-medium">
          <Brain size={12} />
          Gemini AI
        </div>
      </div>

      {/* Top row: Risk meter + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Score Card */}
        <div className="card-glass p-5 flex flex-col items-center justify-center gap-3 md:col-span-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overall Risk Score</p>
          <RiskMeter score={RISK_SCORE} />
          <div className="grid grid-cols-3 gap-2 w-full">
            {[{ label: "Clauses", val: "5", color: "danger" }, { label: "Warnings", val: "3", color: "warning" }, { label: "Pages", val: "48", color: "info" }].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold text-foreground">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card-glass p-5 md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={15} style={{ color: "hsl(var(--primary))" }} />
            <span className="text-sm font-semibold text-foreground">AI-Generated Summary</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This Share Purchase Agreement (48 pages) involves the acquisition of <strong className="text-foreground">TechCorp Holdings Ltd</strong> for
            approximately <strong className="text-foreground">$142M</strong>. The agreement contains several high-risk provisions that warrant
            immediate attention, including an aggressive change-of-control clause and an overly broad IP assignment scope.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Key concerns include the <strong className="text-foreground">3-year non-compete duration</strong> which may be unenforceable across all
            target jurisdictions, and <strong className="text-foreground">missing GDPR Article 28 compliance language</strong> for data processing activities.
            Recommend legal review of Sections 5.2, 8.1, and 12.4 before execution.
          </p>
          <div className="flex items-center gap-2 mt-auto">
            <TrendingUp size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Confidence: <span className="font-semibold text-foreground">94.2%</span> · Analyzed 48 clauses across 5 risk categories</span>
          </div>
        </div>
      </div>

      {/* Risky Clauses */}
      <div className="card-glass p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={15} style={{ color: "hsl(var(--danger))" }} />
          <span className="text-sm font-semibold text-foreground">Detected Risky Clauses</span>
        </div>
        <div className="flex flex-col gap-2">
          {RISKY_CLAUSES.map((clause) => (
            <div key={clause.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors group">
              <div className="w-12 shrink-0 text-center">
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-accent text-accent-foreground">§{clause.id}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{clause.title}</span>
                  <RiskBadge risk={clause.risk} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{clause.description}</p>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary shrink-0">
                <ExternalLink size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Warnings */}
      <div className="card-glass p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} style={{ color: "hsl(var(--warning))" }} />
          <span className="text-sm font-semibold text-foreground">Compliance Warnings</span>
        </div>
        <div className="flex flex-col gap-2">
          {COMPLIANCE_WARNINGS.map((w) => (
            <div key={w.code} className="flex items-start gap-3 p-3 rounded-lg border bg-warning/5 border-warning/20">
              <span className="text-xs font-mono font-bold text-warning shrink-0 mt-0.5">{w.code}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{w.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
