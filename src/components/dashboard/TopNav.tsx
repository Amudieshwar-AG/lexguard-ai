import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface TopNavProps {
  activeSection: string;
}

const sectionTitles: Record<string, string> = {
  dashboard: "AI Legal Due Diligence Dashboard",
  documents: "Document Management",
  risk: "Risk Analysis",
  analytics: "Analytics & Insights",
  chat: "AI Legal Assistant",
  reports: "Report Downloads",
};

export function TopNav({ activeSection }: TopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between shrink-0 sticky top-0 z-20"
      style={{ boxShadow: "var(--shadow-sm)" }}>
      {/* Left: logo + title */}
      <div className="flex items-center gap-3">
        <img src="/favicon.png" alt="LexGuard" className="w-7 h-7 object-contain hidden sm:block" />
        <div>
          <h1 className="text-base font-display font-semibold text-foreground leading-tight">
            {sectionTitles[activeSection] || "Dashboard"}
          </h1>
        </div>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-3">

        {/* User avatar */}
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: "var(--gradient-brand)" }}>
            {user?.initials ?? "?"}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-semibold text-foreground">{user?.fullName ?? "User"}</span>
            <span className="text-xs text-muted-foreground">{user?.role ?? ""}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-danger/10 hover:text-danger text-muted-foreground text-xs font-medium transition-colors border border-transparent hover:border-danger/20"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
