import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/hooks/useDocuments";

type FileStatus = "processing" | "completed" | "error";

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
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { documents, loading, uploadDocument, deleteDocument } = useDocuments();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, []);

  const addFiles = async (newFiles: File[]) => {
    setUploading(true);
    for (const file of newFiles) {
      await uploadDocument(file);
    }
    setUploading(false);
  };

  const removeFile = async (id: string) => {
    try {
      await deleteDocument(id);
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

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
      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          <Clock size={16} className="animate-spin mr-2" /> Loading documents...
        </div>
      ) : documents.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Uploaded Documents ({documents.length})
            </span>
            <span className="text-xs text-muted-foreground">
              {documents.filter((f) => f.status === "completed").length} completed
            </span>
          </div>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto scrollbar-thin">
            {documents.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--primary) / 0.1)" }}>
                  <FileText size={16} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{file.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                    {file.pages && <span className="text-xs text-muted-foreground">· {file.pages} pages</span>}
                    <span className="text-xs text-muted-foreground">· {formatTimeAgo(file.created_at)}</span>
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
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
          <FileText size={32} className="mb-2 opacity-40" />
          <p>No documents uploaded yet</p>
        </div>
      )}
    </div>
  );
}
