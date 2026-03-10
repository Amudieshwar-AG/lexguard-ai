import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type FileStatus = "processing" | "completed" | "error";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  status: FileStatus;
  uploadedAt: string;
  pages?: number;
}

const MOCK_FILES: UploadedFile[] = [
  { id: "1", name: "Share_Purchase_Agreement_2024.pdf", size: "2.4 MB", type: "PDF", status: "completed", uploadedAt: "2 min ago", pages: 48 },
  { id: "2", name: "Regulatory_Compliance_Filing_Q4.pdf", size: "1.1 MB", type: "PDF", status: "completed", uploadedAt: "5 min ago", pages: 22 },
  { id: "3", name: "Shareholder_Rights_Agreement.docx", size: "840 KB", type: "DOCX", status: "processing", uploadedAt: "Just now", pages: 16 },
];

function StatusChip({ status }: { status: FileStatus }) {
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
      <CheckCircle2 size={10} /> Completed
    </span>
  );
  if (status === "processing") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
      <Clock size={10} className="animate-spin" /> Processing
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">
      <AlertCircle size={10} /> Error
    </span>
  );
}

export function DocumentUpload() {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>(MOCK_FILES);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const mapped: UploadedFile[] = newFiles.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      type: f.name.split(".").pop()?.toUpperCase() || "FILE",
      status: "processing" as FileStatus,
      uploadedAt: "Just now",
    }));
    setFiles((prev) => [...mapped, ...prev]);
    // Simulate processing completion
    mapped.forEach((file) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => f.id === file.id ? { ...f, status: "completed" as FileStatus, pages: Math.floor(Math.random() * 50) + 10 } : f)
        );
      }, 3000);
    });
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="card-glass p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-foreground text-base">Document Upload</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Upload legal documents for AI-powered analysis</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-lg">
          <span>Supported:</span>
          <span className="font-medium text-foreground">PDF, DOCX</span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={cn("upload-zone", dragging && "dragging")}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "hsl(var(--primary) / 0.08)" }}>
          <Upload className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {dragging ? "Drop your files here" : "Drag & drop legal documents"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">or click to browse files</p>
        </div>
        <button
          className="btn-primary text-sm"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          <Upload size={14} /> Select Files
        </button>
        <p className="text-xs text-muted-foreground">Max file size: 50 MB · PDF & DOCX only</p>
      </div>
      <input ref={inputRef} type="file" multiple accept=".pdf,.docx" className="hidden"
        onChange={(e) => addFiles(Array.from(e.target.files || []))} />

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Uploaded Documents ({files.length})
            </span>
            <span className="text-xs text-muted-foreground">
              {files.filter((f) => f.status === "completed").length} completed
            </span>
          </div>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto scrollbar-thin">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--primary) / 0.1)" }}>
                  <FileText size={16} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                    {file.pages && <span className="text-xs text-muted-foreground">· {file.pages} pages</span>}
                    <span className="text-xs text-muted-foreground">· {file.uploadedAt}</span>
                  </div>
                </div>
                <StatusChip status={file.status} />
                <button
                  onClick={() => removeFile(file.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
