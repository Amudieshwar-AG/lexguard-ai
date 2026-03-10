import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Award, FileBarChart2 } from "lucide-react";

const RISK_CATEGORY_DATA = [
  { name: "Contractual Risk", value: 32, color: "hsl(0 84% 60%)" },
  { name: "Compliance Risk", value: 24, color: "hsl(38 92% 50%)" },
  { name: "Financial Risk", value: 18, color: "hsl(239 84% 62%)" },
  { name: "IP Risk", value: 15, color: "hsl(262 83% 58%)" },
  { name: "Operational Risk", value: 11, color: "hsl(142 71% 45%)" },
];

const CLAUSE_FREQUENCY_DATA = [
  { clause: "Indemnity", frequency: 18, risk: 14 },
  { clause: "Liability", frequency: 15, risk: 12 },
  { clause: "Change of Control", frequency: 7, risk: 7 },
  { clause: "Non-Compete", frequency: 9, risk: 6 },
  { clause: "Confidentiality", frequency: 22, risk: 4 },
  { clause: "Termination", frequency: 13, risk: 8 },
  { clause: "IP Assignment", frequency: 11, risk: 9 },
];

const COMPLIANCE_SCORES = [
  { label: "GDPR", score: 48, color: "hsl(0 84% 60%)" },
  { label: "SOX", score: 62, color: "hsl(38 92% 50%)" },
  { label: "FCPA", score: 71, color: "hsl(38 92% 50%)" },
  { label: "PCI DSS", score: 84, color: "hsl(142 71% 45%)" },
  { label: "ISO 27001", score: 79, color: "hsl(142 71% 45%)" },
];

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
  const totalDocs = 3;
  const avgRisk = 73;
  const criticalCount = 2;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display font-semibold text-foreground text-base">Analytics & Insights</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Visual analysis of AI risk findings across all documents</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Documents Analyzed", value: totalDocs, sub: "+1 today", icon: FileBarChart2, color: "primary" },
          { label: "Average Risk Score", value: `${avgRisk}%`, sub: "High threshold", icon: TrendingUp, color: "danger" },
          { label: "Critical Issues", value: criticalCount, sub: "Need review", icon: Award, color: "warning" },
          { label: "Compliance Rate", value: "68%", sub: "Needs improvement", icon: Award, color: "success" },
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
            <p className="text-sm font-semibold text-foreground">Risk Category Distribution</p>
            <p className="text-xs text-muted-foreground">AI-classified risk types across all documents</p>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie data={RISK_CATEGORY_DATA} cx="50%" cy="50%" innerRadius={48} outerRadius={80}
                  paddingAngle={3} dataKey="value" stroke="none">
                  {RISK_CATEGORY_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {RISK_CATEGORY_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-muted-foreground flex-1 leading-tight">{d.name}</span>
                  <span className="text-xs font-semibold text-foreground">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="card-glass p-5 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Clause Frequency Analysis</p>
            <p className="text-xs text-muted-foreground">Occurrence vs. risk flags per clause type</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CLAUSE_FREQUENCY_DATA} barSize={9} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="clause" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="frequency" name="Frequency" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="risk" name="Risk Flags" fill="hsl(var(--danger))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance Score Card */}
      <div className="card-glass p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Compliance Score Matrix</p>
            <p className="text-xs text-muted-foreground">Regulatory framework adherence analysis</p>
          </div>
          <span className="text-xs font-medium bg-accent text-accent-foreground px-2.5 py-1.5 rounded-lg">5 Frameworks</span>
        </div>
        <div className="flex flex-col gap-3">
          {COMPLIANCE_SCORES.map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <span className="text-xs font-semibold text-foreground w-20 shrink-0">{item.label}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${item.score}%`, background: item.color }}
                />
              </div>
              <span className="text-xs font-semibold w-10 text-right" style={{ color: item.color }}>{item.score}%</span>
              <span className="text-xs text-muted-foreground w-24 shrink-0">
                {item.score >= 80 ? "✓ Compliant" : item.score >= 60 ? "⚠ Partial" : "✗ Non-Compliant"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
