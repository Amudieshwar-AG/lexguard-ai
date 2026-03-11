import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { DocumentUpload } from "@/components/dashboard/DocumentUpload";
import { RiskAnalysis } from "@/components/dashboard/RiskAnalysis";
import { Analytics } from "@/components/dashboard/Analytics";
import { ChatBot } from "@/components/dashboard/ChatBot";
import { ReportDownload } from "@/components/dashboard/ReportDownload";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <DashboardSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav activeSection={activeSection} />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in-up pb-8">
              {activeSection === "dashboard" && (
                <DashboardHome onSectionChange={setActiveSection} />
              )}
              {activeSection === "documents" && (
                <DocumentUpload />
              )}
              {activeSection === "risk" && (
                <RiskAnalysis />
              )}
              {activeSection === "analytics" && (
                <Analytics />
              )}
              {activeSection === "reports" && (
                <ReportDownload />
              )}
              {activeSection === "chat" && (
                <div className="h-[calc(100vh-7rem)]">
                  <ChatBot />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
