import { useState } from "react";
import TechShieldLogo from "@/components/TechShieldLogo";
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  BarChart3,
  MessageSquare,
  Download,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: FileText, label: "Documents", id: "documents" },
  { icon: ShieldAlert, label: "Risk Analysis", id: "risk" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: MessageSquare, label: "AI Assistant", id: "chat" },
  { icon: Download, label: "Reports", id: "reports" },
];

const bottomItems = [
  { icon: Settings, label: "Settings" },
  { icon: HelpCircle, label: "Help" },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export function DashboardSidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
      style={{ background: "hsl(var(--sidebar-background))" }}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b", collapsed && "justify-center px-0")}
        style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <TechShieldLogo className="w-8 h-8 shrink-0" />
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-white font-display font-semibold text-sm">LexGuard AI</span>
            <span className="text-xs" style={{ color: "hsl(var(--sidebar-foreground))" }}>Legal Intelligence</span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "sidebar-item w-full text-left",
                isActive && "active",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t flex flex-col gap-1" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={cn("sidebar-item w-full text-left", collapsed && "justify-center px-0")}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full border bg-card text-muted-foreground shadow-md hover:text-primary transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
