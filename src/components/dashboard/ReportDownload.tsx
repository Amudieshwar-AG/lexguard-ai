import { Download, FileText, Share2, Printer, CheckCircle2, Clock, FileDown } from "lucide-react";

const REPORTS = [
  {
    id: "1",
    title: "Full Due Diligence Report",
    description: "Comprehensive AI analysis covering all risk categories, clause analysis, and compliance assessment.",
    document: "Share_Purchase_Agreement_2024.pdf",
    generatedAt: "March 10, 2026 · 14:32",
    pages: 24,
    format: "PDF",
    status: "ready",
    size: "3.2 MB",
  },
  {
    id: "2",
    title: "Executive Risk Summary",
    description: "1-page executive briefing with key findings and recommended actions.",
    document: "Share_Purchase_Agreement_2024.pdf",
    generatedAt: "March 10, 2026 · 14:32",
    pages: 2,
    format: "PDF",
    status: "ready",
    size: "480 KB",
  },
  {
    id: "3",
    title: "Compliance Checklist",
    description: "Structured compliance gap analysis with remediation recommendations per regulatory framework.",
    document: "Regulatory_Compliance_Filing_Q4.pdf",
    generatedAt: "March 10, 2026 · 14:28",
    pages: 8,
    format: "DOCX",
    status: "ready",
    size: "1.1 MB",
  },
  {
    id: "4",
    title: "Clause Redline Annotations",
    description: "Annotated version of the original contract with AI-flagged clause explanations.",
    document: "Shareholder_Rights_Agreement.docx",
    generatedAt: "Generating...",
    pages: null,
    format: "PDF",
    status: "generating",
    size: null,
  },
];

function handleDownload(title: string) {
  // Simulate download with a toast-like behavior
  alert(`Downloading: ${title}\n(Demo: actual download would occur in production)`);
}

export function ReportDownload() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-foreground text-base">Report Downloads</h2>
          <p className="text-xs text-muted-foreground mt-0.5">AI-generated due diligence reports ready for export</p>
        </div>
        <button className="btn-primary text-xs">
          <FileDown size={13} /> Generate New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REPORTS.map((report) => (
          <div key={report.id} className="card-glass-hover p-5 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--primary) / 0.1)" }}>
                <FileText size={18} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{report.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{report.document}</p>
              </div>
              {report.status === "ready" ? (
                <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
              ) : (
                <Clock size={16} className="text-warning animate-spin shrink-0 mt-0.5" />
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">{report.description}</p>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{report.format}</span>
              {report.pages && <span>{report.pages} pages</span>}
              {report.size && <span>{report.size}</span>}
              <span className="ml-auto">{report.generatedAt}</span>
            </div>

            {/* Actions */}
            {report.status === "ready" ? (
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <button
                  onClick={() => handleDownload(report.title)}
                  className="btn-primary flex-1 justify-center text-xs py-2"
                >
                  <Download size={13} /> Download {report.format}
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Share2 size={13} />
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Printer size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary w-2/3 animate-pulse" />
                </div>
                <span className="text-xs text-muted-foreground">Processing...</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <FileDown size={16} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-foreground">Reports are AI-generated and not a substitute for legal counsel</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            LexGuard AI reports are intended for preliminary due diligence assistance only. Always engage qualified legal professionals before making transaction decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
