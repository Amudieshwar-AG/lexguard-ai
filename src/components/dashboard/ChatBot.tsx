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

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Hello! I'm your **LexGuard AI Legal Assistant**, powered by Google Gemini. I've analyzed your uploaded documents and I'm ready to help.\n\nYou can ask me to explain clauses, summarize agreements, identify risks, or provide legal insights. How can I assist you today?",
    ts: "Just now",
  },
];

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
  // Simple markdown-like rendering
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

interface ChatBotProps {
  supabaseUrl?: string;
  publishableKey?: string;
}

export function ChatBot({ supabaseUrl, publishableKey }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
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

    try {
      if (supabaseUrl && publishableKey) {
        // Real AI call via edge function
        const conversationMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch(`${supabaseUrl}/functions/v1/lexguard-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publishableKey}`,
          },
          body: JSON.stringify({ messages: conversationMessages }),
        });

        if (!response.ok || !response.body) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        const assistantId = (Date.now() + 1).toString();

        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", ts: "Just now" }]);

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || !line.trim()) continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantText += delta;
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, content: assistantText } : m)
                );
              }
            } catch { /* partial */ }
          }
        }
      } else {
        // Fallback mock responses for demo
        await new Promise((r) => setTimeout(r, 1500));
        const mockResponses: Record<string, string> = {
          "risk": "Based on my analysis of **Share_Purchase_Agreement_2024.pdf**, I've identified **3 high-risk** and **2 medium-risk** issues:\n\n**🔴 Critical:**\n• **§5.2 Change of Control** — triggers automatic termination without notice\n• **§8.1 Liability Cap** — restricts recovery to 12-month contract value only\n\n**🟡 Medium:**\n• **§12.4 Non-Compete** — 3-year duration may not be enforceable across all jurisdictions\n• **§15.7 Arbitration Venue** — Singapore-only clause limits EU party rights\n\nI recommend prioritizing negotiation of the liability cap and change-of-control provisions before execution.",
          "clause": "**§5.2 — Change of Control Provision** (Explained Simply):\n\nThis clause means: *if someone buys more than 25% of the company, all contracts automatically end immediately — no warning, no transition period.*\n\n**Why it's risky:**\n• No notice period for the acquirer to renegotiate\n• Could void customer contracts mid-acquisition\n• Creates significant enterprise value risk\n\n**Recommended fix:** Request a 90-day cure period and require written consent rather than automatic termination.",
          "summary": "**Agreement Summary: Share Purchase Agreement 2024**\n\n📋 **Transaction:** Acquisition of TechCorp Holdings Ltd for ~$142M\n👥 **Parties:** Buyer Corp (acquirer) & TechCorp Holdings Ltd (target)\n📄 **Length:** 48 pages across 22 sections\n\n**Key Terms:**\n• Purchase price: $142M (80% cash, 20% earnout)\n• Closing conditions: Regulatory approval + material adverse change\n• Representations & warranties: 24 months post-closing\n\n**⚠️ Top Concerns:**\n1. Aggressive change-of-control provision\n2. Missing GDPR data processing addendum\n3. Overly broad IP assignment scope\n\nOverall risk assessment: **73% (High)**",
        };

        let responseContent = "I've analyzed your uploaded documents. Based on the **Share_Purchase_Agreement_2024.pdf** and related filings:\n\nThis appears to be a complex acquisition agreement with several areas requiring careful review. The overall risk profile is **High (73%)** based on 48 detected clauses.\n\nCould you be more specific about what aspect you'd like me to analyze? I can:\n• Explain specific clause numbers\n• Compare terms against market standards\n• Identify negotiation leverage points\n• Assess jurisdiction-specific risks";

        const lowerText = text.toLowerCase();
        if (lowerText.includes("risk") || lowerText.includes("major")) responseContent = mockResponses.risk;
        else if (lowerText.includes("clause") || lowerText.includes("5.2") || lowerText.includes("explain")) responseContent = mockResponses.clause;
        else if (lowerText.includes("summar")) responseContent = mockResponses.summary;

        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseContent,
          ts: "Just now",
        }]);
      }
    } catch (error: any) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ ${error?.message || "Something went wrong. Please try again."}`,
        ts: "Just now",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
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
