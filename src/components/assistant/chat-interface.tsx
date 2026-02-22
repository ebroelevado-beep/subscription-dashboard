"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { Send, Bot, Trash2, Loader2, Github, Copy, Check, Terminal, ChevronDown, ChevronUp, BrainCircuit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // Required for LaTeX math to render nicely

type ExtendedUIMessagePart = {
  type: string;
  text?: string;
  toolName?: string;
  toolCallId?: string;
  result?: unknown;
  output?: unknown;
  state?: string;
  toolInvocation?: { state: string; result?: unknown; args?: unknown };
  toolCall?: { toolName: string; args?: unknown };
  input?: unknown;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-6 text-muted-foreground hover:text-foreground"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      title="Copiar mensaje"
    >
      {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
    </Button>
  );
}

function ReasonerBlock({ text, isThinking }: { text: string, isThinking?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="my-3 rounded-lg border bg-muted/20 overflow-hidden text-sm">
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isThinking ? (
            <Loader2 className="size-3.5 animate-spin text-primary" />
          ) : (
            <BrainCircuit className="size-3.5 text-primary" />
          )}
          {isThinking ? "Pensando..." : "Proceso de pensamiento"}
        </div>
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>
      {open && text && (
        <div className="p-3 pt-0 text-muted-foreground text-xs leading-relaxed border-t border-border/50 bg-muted/10">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            className="prose prose-sm dark:prose-invert"
          >
            {text}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function parseTextWithThinking(text: string): { type: string; content: string; isComplete?: boolean }[] {
  const parts: { type: string; content: string; isComplete?: boolean }[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    const thinkStart = remaining.indexOf("<think>");
    if (thinkStart === -1) {
      if (remaining.trim()) parts.push({ type: "text", content: remaining });
      break;
    }
    
    if (thinkStart > 0) {
      const textBefore = remaining.slice(0, thinkStart);
      if (textBefore.trim()) parts.push({ type: "text", content: textBefore });
    }
    
    const thinkEnd = remaining.indexOf("</think>", thinkStart);
    if (thinkEnd === -1) {
      parts.push({ type: "thinking", content: remaining.slice(thinkStart + 7), isComplete: false });
      break;
    } else {
      parts.push({ type: "thinking", content: remaining.slice(thinkStart + 7, thinkEnd), isComplete: true });
      remaining = remaining.slice(thinkEnd + 8);
    }
  }
  
  return parts;
}

function ToolInvocationBlock({ part }: { part: ExtendedUIMessagePart & { toolInvocation?: { toolName?: string; state: string; result?: unknown; args?: unknown; error?: string }; errorText?: string } }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'args' | 'output'>('output');
  const toolName = part.toolName || part.toolInvocation?.toolName || part.toolCall?.toolName || part.type.replace('tool-', '') || 'tool';
  
  const state = part.state || part.toolInvocation?.state;
  const isFinished = 
    state === 'result' || 
    state === 'error' || 
    state === 'output-available' || 
    state === 'output-error' || 
    'result' in part || 
    'output' in part || 
    'errorText' in part ||
    part.type === 'tool-result' || 
    part.type === 'tool-error' || 
    part.type === 'tool-output-available' || 
    part.type === 'tool-output-error';

  // Find the args and output
  const args = part.input || part.toolInvocation?.args || part.toolCall?.args || {};
  const hasArgs = args && Object.keys(args).length > 0;
  
  const output = part.output || part.result || part.toolInvocation?.result;
  const hasOutput = output !== undefined && output !== null;
  const errorText = part.errorText || part.toolInvocation?.error;
  const isError = !!errorText || state === 'error' || state === 'output-error' || part.type === 'tool-output-error';

  // Recursively parse stringified JSON values for readable display
  const deepParseJson = (val: unknown): unknown => {
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (typeof parsed === 'object' && parsed !== null) return deepParseJson(parsed);
        return parsed;
      } catch { return val; }
    }
    if (Array.isArray(val)) return val.map(deepParseJson);
    if (typeof val === 'object' && val !== null) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val)) out[k] = deepParseJson(v);
      return out;
    }
    return val;
  };

  const formattedArgs = deepParseJson(args);
  const formattedOutput = deepParseJson(output);

  if (isFinished) {
    return (
      <div className="my-3 flex flex-col gap-0 text-xs bg-background/50 rounded-lg border shadow-sm overflow-hidden w-full sm:w-[80%]">
        <button 
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between p-2.5 text-muted-foreground hover:bg-muted/40 transition-colors w-full text-left"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <div className={`size-4 rounded-full flex items-center justify-center shrink-0 ${isError ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              {isError ? <AlertCircle className="size-2.5 text-red-500" /> : <Check className="size-2.5 text-green-500" />}
            </div>
            <Terminal className="size-3 shrink-0" />
            <span className="text-foreground truncate">{toolName}</span> {isError ? 'error' : 'completado'}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] mr-1">{open ? "Ocultar Detalles" : "Ver Detalles"}</span>
            {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </div>
        </button>
        {open && (
          <div className="border-t border-border/50">
            {/* Tab buttons */}
            <div className="flex border-b border-border/30">
              <button
                type="button"
                onClick={() => setActiveTab('args')}
                className={`flex-1 py-1.5 px-3 text-[10px] font-medium transition-colors ${
                  activeTab === 'args'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                Input {hasArgs && <span className="ml-1 opacity-50">({Object.keys(args).length})</span>}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('output')}
                className={`flex-1 py-1.5 px-3 text-[10px] font-medium transition-colors ${
                  activeTab === 'output'
                    ? `border-b-2 bg-primary/5 ${isError ? 'text-red-500 border-red-500' : 'text-primary border-primary'}`
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                Output {isError && <span className="ml-1 text-red-400">✕</span>}
              </button>
            </div>
            {/* Tab content */}
            <div className="p-3 bg-muted/10 overflow-x-auto">
              {activeTab === 'args' && (
                hasArgs ? (
                  <pre className="text-[11px] font-mono text-muted-foreground bg-background p-2.5 rounded border overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(formattedArgs, null, 2)}
                  </pre>
                ) : (
                  <div className="text-[11px] text-muted-foreground font-medium italic">Sin input.</div>
                )
              )}
              {activeTab === 'output' && (
                isError ? (
                  <div className="text-[11px] font-mono text-red-400 bg-red-500/5 p-2.5 rounded border border-red-500/20 overflow-x-auto whitespace-pre-wrap break-words">
                    {errorText || 'Error desconocido'}
                  </div>
                ) : hasOutput ? (
                  <pre className="text-[11px] font-mono text-muted-foreground bg-background p-2.5 rounded border overflow-x-auto whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
                    {typeof formattedOutput === 'string' ? formattedOutput : JSON.stringify(formattedOutput, null, 2)}
                  </pre>
                ) : (
                  <div className="text-[11px] text-muted-foreground font-medium italic">Sin resultado disponible.</div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Still loading
  return (
    <div className="my-3 flex items-center gap-2.5 text-xs bg-background/50 p-2.5 rounded-lg border shadow-sm text-muted-foreground font-medium w-full sm:w-[80%] border-primary/20">
      <Loader2 className="size-3.5 animate-spin text-primary shrink-0" />
      Ejecutando <span className="text-foreground animate-pulse truncate">{toolName}</span>...
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ChatInterface() {
  // Copilot Auth State
  const [hasCopilot, setHasCopilot] = useState<boolean | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUri, setVerificationUri] = useState<string | null>(null);
  
  // Model Selection State
  const [models, setModels] = useState<{id: string, name?: string}[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    fetch("/api/copilot/status")
      .then(res => res.json())
      .then(data => setHasCopilot(data.hasToken))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (hasCopilot) {
      fetch("/api/copilot/models")
        .then(res => res.json())
        .then(data => {
          if (data && data.data && Array.isArray(data.data)) {
             // Deduplicate models by id to prevent React key warnings
             const seen = new Set<string>();
             const unique = data.data.filter((m: {id: string, capabilities?: {type?: string}}) => {
               if (seen.has(m.id)) return false;
               // Filter out embeddings models, ensure it's a chat model
               if (m.capabilities?.type && m.capabilities.type !== "chat") return false;
               if (m.id.includes("embedding")) return false;
               seen.add(m.id);
               return true;
             });
             setModels(unique);
             if (unique.length > 0) {
               const defaultModel = unique.find((m: {id: string, capabilities?: {type?: string}}) => m.id === "gpt-4o") || unique[0];
               setSelectedModel(defaultModel.id);
             }
          }
        })
        .catch(console.error);
    }
  }, [hasCopilot]);

  const initiateCopilotAuth = async () => {
    try {
      setUserCode(null);
      const res = await fetch("/api/copilot/device-code", { method: "POST" });
      const data = await res.json();
      
      setUserCode(data.user_code);
      setVerificationUri(data.verification_uri);
      
      pollForToken(data.device_code, data.interval || 5);
    } catch (err) {
      console.error(err);
    }
  };

  const pollForToken = async (deviceCodeStr: string, intervalSeconds: number) => {
    let polling = true;
    while (polling) {
      await new Promise(r => setTimeout(r, intervalSeconds * 1000));
      try {
        const res = await fetch("/api/copilot/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_code: deviceCodeStr })
        });
        const data = await res.json();
        
        if (data.success) {
          setHasCopilot(true);
          polling = false;
        } else if (data.pending) {
          // keep polling
        } else {
          console.error("Polling error:", data.error);
          polling = false;
        }
      } catch (err) {
        console.error(err);
        polling = false;
      }
    }
  };

  const [input, setInput] = useState("");

  // Vercel AI SDK v4 — useChat with sendMessage API
  const { messages, sendMessage, status, setMessages } = useChat({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !sendMessage) return;
    sendMessage(
      { text: input },
      { body: { model: selectedModel || undefined } }
    );
    setInput("");
  };

  const isLoading = status === "submitted" || status === "streaming";

  if (hasCopilot === null) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasCopilot === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background p-6">
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Github className="size-8 text-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Connect GitHub Copilot</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Pearfect AI uses your existing GitHub Copilot subscription to answer questions and analyze your revenue securely.
            </p>
          </div>
          
          {!userCode ? (
            <Button onClick={initiateCopilotAuth} size="lg" className="w-full sm:w-auto">
              Connect via Device Flow
            </Button>
          ) : (
            <div className="flex flex-col items-center space-y-4 w-full p-6 bg-muted/30 border rounded-xl">
              <p className="text-sm font-medium">1. Open the verification link:</p>
              <a href={verificationUri || "#"} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm font-medium">
                {verificationUri}
              </a>
              <p className="text-sm font-medium mt-4">2. Enter this code:</p>
              <div className="text-3xl font-mono font-bold tracking-widest text-primary p-4 bg-background border rounded-lg shadow-inner w-full text-center">
                {userCode}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <Loader2 className="size-4 animate-spin" />
                Waiting for authorization...
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary">
              <Bot className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Pearfect AI</h2>
              <p className="text-sm text-muted-foreground mb-1">
                Powered by GitHub Models
              </p>
            </div>
          </div>
          
          {hasCopilot && models.length > 0 && (
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
              <SelectTrigger className="w-[180px] h-8 text-xs font-medium">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.name || m.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {messages.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setMessages([])}
            className="text-muted-foreground hover:text-destructive"
            disabled={isLoading}
          >
            <Trash2 className="size-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto w-full">
        <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-40 space-y-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="size-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">How can I help you today?</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Ask me about your clients, active subscriptions, revenue metrics, or anything else about your business.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m: UIMessage) => (
              <div
                key={m.id}
                className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <Avatar className="size-8 shrink-0 border">
                  {m.role === "user" ? (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">U</AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <Bot className="size-4" />
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Message Bubble */}
                 <div
                  className={`flex flex-col gap-1 w-full max-w-full ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm shadow-sm relative group w-full ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground inline-block self-end"
                        : "bg-muted/50 text-foreground border min-w-[300px]"
                    }`}
                  >
                    {m.parts && m.parts.length > 0 && m.parts.map((part: ExtendedUIMessagePart, i: number) => {
                      if (part.type === 'text') {
                        const parsed = parseTextWithThinking(part.text || "");
                        return parsed.map((p: { type: string; content: string; isComplete?: boolean }, j: number) => {
                          if (p.type === "thinking") {
                            return <ReasonerBlock key={`${i}-${j}`} text={p.content.trim()} isThinking={!p.isComplete} />;
                          }
                          return (
                            <div key={`${i}-${j}`} className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed mb-3 last:mb-0">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                  table: ({node: _node, ...props}) => {
                                    void _node;
                                    return (
                                      <div className="my-4 w-full overflow-x-auto rounded-lg border bg-card text-card-foreground shadow-sm">
                                        <table className="w-full text-sm text-left break-words" {...props} />
                                      </div>
                                    );
                                  },
                                  thead: ({node: _node, ...props}) => {
                                    void _node;
                                    return <thead className="border-b bg-muted/50 font-medium" {...props} />;
                                  },
                                  tbody: ({node: _node, ...props}) => {
                                    void _node;
                                    return <tbody className="divide-y" {...props} />;
                                  },
                                  tr: ({node: _node, ...props}) => {
                                    void _node;
                                    return <tr className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" {...props} />;
                                  },
                                  th: ({node: _node, ...props}) => {
                                    void _node;
                                    return <th className="h-10 px-3 py-2 align-middle font-medium text-muted-foreground min-w-[100px]" {...props} />;
                                  },
                                  td: ({node: _node, ...props}) => {
                                    void _node;
                                    return <td className="p-3 align-middle min-w-[100px]" {...props} />;
                                  },
                                }}
                              >
                                {p.content}
                              </ReactMarkdown>
                            </div>
                          );
                        });
                      }
                      
                      if (part.type === 'tool-invocation' || part.type?.startsWith('tool-') || part.type === 'dynamic-tool' || part.type === 'tool-call') {
                        return <ToolInvocationBlock key={i} part={part} />;
                      }
                      return null;
                    })}

                    {/* Copy Button for Assistant */}
                    {m.role !== "user" && (
                      <div className="absolute -bottom-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-full shadow-sm p-0.5 z-10">
                        <CopyButton text={m.parts?.filter((p) => p.type === 'text').map((p) => p.text).join("") || ""} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
          
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-4">
              <Avatar className="size-8 shrink-0 border">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <Bot className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center max-w-[85%]">
                <div className="flex items-center gap-2 bg-muted/50 rounded-2xl px-4 py-3 border shadow-sm">
                  <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground font-medium animate-pulse">
                    Analizando tu consulta...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 max-w-3xl mx-auto relative"
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about revenue, expiries, or your clients..."
            className="flex-1 h-12 rounded-full pl-4 pr-12 bg-muted/30 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !input.trim()}
            className="absolute right-1 size-10 rounded-full"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 ml-0.5" />}
          </Button>
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-muted-foreground font-medium">
            AI can make mistakes. Verify important financial data.
          </span>
        </div>
      </div>
    </div>
  );
}
