import { Download, FileText, Share2, Printer, CheckCircle2, FileDown, Loader2, FileBarChart2, AlertCircle } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { useDocuments } from "@/hooks/useDocuments";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function ReportDownload() {
  const { reports, loading, error, generateReport, downloadReport } = useReports();
  const { documents } = useDocuments();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  async function handleGenerate(type: "full_due_diligence" | "executive_summary" = "full_due_diligence") {
    if (documents.length === 0) return;
    setGenerating(true);
    setGenError(null);
    try {
      await generateReport(documents[0].id, type);
      toast({ title: "Report ready", description: "Your PDF report has been generated." });
    } catch (err) {
      const msg = err instanceof Error ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message) : String(err);
      setGenError(msg);
      toast({ title: "Report generation failed", description: msg, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(report: Parameters<typeof downloadReport>[0]) {
    try {
      await downloadReport(report);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Download failed", description: msg, variant: "destructive" });
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
          <p className="text-xs text-muted-foreground mt-0.5">
            Reports are auto-generated after document analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary text-xs"
            onClick={() => handleGenerate("executive_summary")}
            disabled={generating || documents.length === 0}
            title="Manually generate executive summary"
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
            Regenerate Summary
          </button>
          <button
            className="btn-primary text-xs"
            onClick={() => handleGenerate("full_due_diligence")}
            disabled={generating || documents.length === 0}
            title="Manually generate full report"
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
            {generating ? "Generating…" : "Regenerate Full Report"}
          </button>
        </div>
      </div>

      {genError && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span><strong>Generation failed:</strong> {genError}</span>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="card-glass p-12 flex flex-col items-center justify-center text-center">
          <FileBarChart2 size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Reports Available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {documents.length === 0
              ? "Upload and analyze documents to automatically generate AI-powered due diligence reports."
              : "Analyze your documents in the Risk Analysis section. Reports will be automatically generated."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reports.map((report) => {
            const doc = documents.find(d => d.id === report.document_id);
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
                  <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs uppercase">PDF</span>
                  <span className="capitalize">Ready</span>
                  <span className="ml-auto">{createdAt}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <button
                    onClick={() => handleDownload(report)}
                    className="btn-primary flex-1 justify-center text-xs py-2"
                  >
                    <Download size={13} /> Download PDF
                  </button>
                  <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Share2 size={13} />
                  </button>
                  <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Printer size={13} />
                  </button>
                </div>
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
