"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Message = { role: "system" | "user" | "assistant"; content: string };

const DEFAULT_DEV_MESSAGE =
  "You are Trinity. Speak in terse, enigmatic lines with quiet urgency. Hint, do not fully disclose. Sound like cryptic whispers from the Matrix without quoting verbatim. Be minimal, confident, and slightly ominous. Guide the user as if you know more than you’ll say. Offer fragments, choices, and paths. Keep replies short.";

export default function Page() {
  const [developerMessage, setDeveloperMessage] =
    useState<string>(DEFAULT_DEV_MESSAGE);
  // API key handled server-side now
  const [apiKey, setApiKey] = useState<string>("");
  const [rememberKey, setRememberKey] = useState<boolean>(false);
  const [model, setModel] = useState<string>("gpt-4.1-mini");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  // No longer loading or storing API key on the client

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isStreaming]);

  useEffect(() => {
    // focus the hidden input so typing goes to CLI line
    hiddenInputRef.current?.focus();
  }, []);

  const apiBase = useMemo(() => {
    // On Vercel, the backend is mounted at /api via vercel.json routing
    // For local dev, we assume backend runs on :8000. Use relative if same origin.
    if (typeof window === "undefined") return "/api";
    const sameOriginHasApi = true; // rely on vercel.json route
    return sameOriginHasApi ? "/api" : "http://localhost:8000/api";
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [
      ...prev,
      userMsg,
      { role: "assistant", content: "" },
    ]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMsg.content,
          model,
        }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          // Update last assistant message incrementally
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "assistant") {
              next[i] = { ...next[i], content: assistantText };
              break;
            }
          }
          return next;
        });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: `Error: ${err?.message || String(err)}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, developerMessage, model, apiBase]);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void sendMessage();
    },
    [sendMessage]
  );

  const onToggleRemember = useCallback((checked: boolean) => {
    setRememberKey(checked);
  }, []);

  const onApiKeyChange = useCallback((_v: string) => {}, []);

  return (
    <div className="wrap">
      <div className="term" ref={scrollRef}>
        <div className="header">Hello, Neo.</div>
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`line ${m.role}`}>
              <span className="role">
                {m.role === "user" ? "🦄" : m.role === "assistant" ? "🐇" : "!"}
              </span>
              <div className={`bubble ${m.role}`}>{m.content}</div>
            </div>
          ))}
          {isStreaming && <div className="blink">receiving...</div>}
        </div>
      </div>
      <div className="cli" onClick={() => hiddenInputRef.current?.focus()}>
        <div className="cli-line">
          <span className="cli-typed">{input}</span>
          <span className="cli-cursor" aria-hidden>
            🦄
          </span>
        </div>
        <input
          ref={hiddenInputRef}
          className="cli-hidden-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void sendMessage();
            }
          }}
          aria-label="Type your message"
        />
      </div>
    </div>
  );
}
