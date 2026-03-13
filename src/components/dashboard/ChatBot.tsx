import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, RotateCcw, Copy, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: string;
}

const SUGGESTED_PROMPTS = [
  "What are the major risks in this contract?",
  "Explain clause 5.2 in simple terms",
  "Summarize this agreement",
  "What compliance issues were detected?",
  "Is the non-compete clause enforceable?",
  "What should I negotiate before signing?",
];

const MOCK_RESPONSES: Record<string, string> = {
  risk: "Based on my analysis, the major risks in this contract include:\n\n**1. Termination Clauses** — Change-of-control provisions could allow counterparty to exit without penalty.\n\n**2. Indemnification Cap** — The cap at 1× fees is considered inadequate for enterprise agreements.\n\n**3. IP Ownership** — Section 8 lacks clarity on work-product ownership during the engagement period.\n\nI recommend reviewing these with your legal counsel before signing.",
  clause: "Clause 5.2 relates to **Limitation of Liability**. In plain terms: neither party can be held responsible for indirect losses (like lost profits) even if they knew the risk existed. The cap limits total liability to the fees paid in the prior 12 months. This is a fairly standard clause, though the cap amount may be worth negotiating upward.",
  summar: "**Document Summary:**\n\nThis is a commercial services agreement between two parties covering a 24-month engagement. Key terms include:\n- **Scope**: Software development and consulting services\n- **Payment**: Monthly retainer plus milestone-based fees\n- **IP**: All deliverables assigned to the client upon full payment\n- **Termination**: 30-day notice for convenience, immediate for cause\n\nOverall risk level: **Medium-High** based on indemnification and liability terms.",
  complian: "The following compliance issues were identified:\n\n**GDPR / Data Privacy** — Section 12 lacks a Data Processing Agreement (DPA) as required under GDPR Article 28.\n\n**Export Controls** — No mention of export compliance obligations which may apply given the technology involved.\n\n**Employment Law** — Contractor classification language in Section 3 may conflict with local employment statutes.\n\nRecommendation: Attach a DPA addendum and add a compliance representations clause.",
  "non-compete": "Non-compete enforceability depends heavily on jurisdiction. Based on the contract language:\n\n- **Duration**: 24 months post-termination — this may be excessive in states like California (where non-competes are largely unenforceable).\n- **Geographic Scope**: Global scope is broadly written and faces scrutiny in EU jurisdictions.\n- **Scope of Activity**: \"Substantially similar business\" is vague.\n\nIn most US states, courts will narrow (blue-pencil) overly broad non-competes rather than void them entirely.",
  negotiat: "Key items to negotiate before signing:\n\n**1. Liability Cap** — Push for 2× or 3× annual fees instead of 1×.\n\n**2. IP Warranty** — Request a warranty that deliverables are free of third-party IP encumbrances.\n\n**3. Payment Terms** — Net-30 is standard; push back on Net-15 if present.\n\n**4. Termination for Convenience** — Increase notice period from 30 to 60 days.\n\n**5. Dispute Resolution** — Prefer arbitration with a neutral venue over the counterparty's home jurisdiction.",
};

function getMockResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key.replace("-", " "))) return response;
  }
  return "Thank you for your question. Based on my analysis of the uploaded documents, I can see several relevant clauses that apply here. The contract contains standard commercial terms with a few provisions that warrant closer attention — particularly around liability, termination rights, and IP ownership. I'd recommend focusing on Sections 5, 8, and 12 when reviewing with your legal team.\n\nWould you like me to explain any specific clause in more detail?";
}

function TypingIndicator() {
  return (
    <div className="chat-bubble-ai flex items-center gap-1.5 py-3">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-2 h-2 rounded-full bg-primary"
          style={{ animation: `pulse-dot 1.4s ease-in-out infinite`, animationDelay: `${i * 0.16}s` }} />
      ))}
    </div>
  );
}

function formatContent(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

interface ChatBotProps {
  supabaseUrl?: string;
  publishableKey?: string;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hello! I'm your **LexGuard AI Legal Assistant**. I've analyzed your uploaded documents and I'm ready to help.\n\nYou can ask me to explain clauses, summarize agreements, identify risks, or provide legal insights. How can I assist you today?",
  ts: "Just now",
};

export function ChatBot({ supabaseUrl, publishableKey }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setShowSuggestions(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      ts: "Just now",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: getMockResponse(text),
      ts: "Just now",
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setShowSuggestions(true);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden"
      style={{ boxShadow: "var(--shadow-md)" }}>
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border flex items-center gap-3"
        style={{ background: "var(--gradient-brand)" }}>
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white font-display">AI Legal Assistant</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            <span className="text-xs text-white/80">Gemini · Ready</span>
          </div>
        </div>
        <button onClick={clearChat} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Clear chat">
          <RotateCcw size={13} className="text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              msg.role === "user" ? "bg-primary" : "bg-muted border border-border")}>
              {msg.role === "user"
                ? <User size={13} className="text-white" />
                : <Sparkles size={13} style={{ color: "hsl(var(--primary))" }} />
              }
            </div>
            <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
              <p className="text-xs" dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
              {msg.role === "assistant" && msg.content && (
                <button
                  onClick={() => navigator.clipboard?.writeText(msg.content)}
                  className="mt-2 opacity-0 hover:opacity-100 group-hover:opacity-100 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all"
                  style={{ opacity: 0.5 }}
                >
                  <Copy size={10} /> Copy
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={13} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {showSuggestions && (
        <div className="px-4 pb-2 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Suggested questions</span>
            <button onClick={() => setShowSuggestions(false)} className="ml-auto text-muted-foreground hover:text-foreground">
              <ChevronDown size={12} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/30 transition-all leading-tight text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border">
        <div className="flex items-end gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50 focus-within:bg-card transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about clauses, risks, compliance..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground resize-none outline-none leading-relaxed max-h-24 min-h-[20px]"
            rows={1}
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 96)}px`;
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
              input.trim() && !isLoading
                ? "bg-primary text-white hover:opacity-90 shadow-brand"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Powered by Google Gemini · Not legal advice
        </p>
      </div>
    </div>
  );
}
