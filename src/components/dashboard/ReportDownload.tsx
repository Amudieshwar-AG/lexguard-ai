import { Download, FileText, Share2, Printer, CheckCircle2, Clock, FileDown, Loader2, FileBarChart2 } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { useDocuments } from "@/hooks/useDocuments";
import { useState } from "react";

export function ReportDownload() {
  const { reports, loading, error, generateReport, downloadReport } = useReports();
  const { documents } = useDocuments();
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (documents.length === 0) return;
    setGenerating(true);
    try {
      await generateReport(documents[0].id, "full_due_diligence");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p className="text-sm">Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-glass p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-foreground text-base">Report Downloads</h2>
          <p className="text-xs text-muted-foreground mt-0.5">AI-generated due diligence reports ready for export</p>
        </div>
        <button
          className="btn-primary text-xs"
          onClick={handleGenerate}
          disabled={generating || documents.length === 0}
        >
          {generating ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
          {generating ? "Generating..." : "Generate New Report"}
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="card-glass p-12 flex flex-col items-center justify-center text-center">
          <FileBarChart2 size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Reports Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {documents.length === 0
              ? "Upload documents first, then generate AI-powered due diligence reports."
              : "Click \"Generate New Report\" to create your first AI-powered report."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reports.map((report) => {
            const doc = documents.find(d => d.id === report.document_id);
            const isReady = report.status === "completed";
            const createdAt = new Date(report.created_at).toLocaleString();

            return (
              <div key={report.id} className="card-glass-hover p-5 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}>
                    <FileText size={18} style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight capitalize">
                      {report.report_type?.replace(/_/g, " ") || "Report"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {doc?.file_name || "Unknown document"}
                    </p>
                  </div>
                  {isReady ? (
                    <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                  ) : (
                    <Clock size={16} className="text-warning animate-spin shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs uppercase">
                    {report.format || "PDF"}
                  </span>
                  <span className="capitalize">{report.status}</span>
                  <span className="ml-auto">{createdAt}</span>
                </div>

                {/* Actions */}
                {isReady ? (
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <button
                      onClick={() => downloadReport(report)}
                      className="btn-primary flex-1 justify-center text-xs py-2"
                    >
                      <Download size={13} /> Download
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
            );
          })}
        </div>
      )}

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
