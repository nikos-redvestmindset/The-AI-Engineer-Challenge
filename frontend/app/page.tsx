"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Message = { role: "system" | "user" | "assistant"; content: string };

const DEFAULT_DEV_MESSAGE = "You are a helpful assistant.";

export default function Page() {
  const [developerMessage, setDeveloperMessage] = useState<string>(DEFAULT_DEV_MESSAGE);
  const [apiKey, setApiKey] = useState<string>("");
  const [rememberKey, setRememberKey] = useState<boolean>(false);
  const [model, setModel] = useState<string>("gpt-4.1-mini");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("openai_api_key");
    if (saved) {
      setApiKey(saved);
      setRememberKey(true);
    }
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isStreaming]);

  const apiBase = useMemo(() => {
    // On Vercel, the backend is mounted at /api via vercel.json routing
    // For local dev, we assume backend runs on :8000. Use relative if same origin.
    if (typeof window === "undefined") return "/api";
    const sameOriginHasApi = true; // rely on vercel.json route
    return sameOriginHasApi ? "/api" : "http://localhost:8000/api";
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !apiKey) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
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
          api_key: apiKey
        })
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
        { role: "system", content: `Error: ${err?.message || String(err)}` }
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, apiKey, developerMessage, model, apiBase]);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void sendMessage();
    },
    [sendMessage]
  );

  const onToggleRemember = useCallback(
    (checked: boolean) => {
      setRememberKey(checked);
      if (!checked) {
        localStorage.removeItem("openai_api_key");
      } else if (apiKey) {
        localStorage.setItem("openai_api_key", apiKey);
      }
    },
    [apiKey]
  );

  const onApiKeyChange = useCallback((v: string) => {
    setApiKey(v);
    if (rememberKey) {
      if (v) localStorage.setItem("openai_api_key", v);
      else localStorage.removeItem("openai_api_key");
    }
  }, [rememberKey]);

  return (
    <div className="wrap">
      <div className="term" ref={scrollRef}>
        <div className="header">MATRIX TERMINAL // LLM LINK ESTABLISHED</div>
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`line ${m.role}`}>
              <span className="role">{m.role === "user" ? "🦄" : m.role === "assistant" ? "λ" : "!"}</span>
              <span className="content">{m.content}</span>
            </div>
          ))}
          {isStreaming && (
            <div className="blink">receiving...</div>
          )}
        </div>
      </div>
      <form className="controls" onSubmit={onSubmit}>
        <div className="row">
          <label className="lbl">API Key</label>
          <input
            className="in"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            required
          />
          <label className="chk">
            <input
              type="checkbox"
              checked={rememberKey}
              onChange={(e) => onToggleRemember(e.target.checked)}
            />
            remember
          </label>
        </div>
        <div className="row">
          <label className="lbl">System</label>
          <input
            className="in"
            type="text"
            value={developerMessage}
            onChange={(e) => setDeveloperMessage(e.target.value)}
          />
        </div>
        <div className="row">
          <label className="lbl">Model</label>
          <input
            className="in"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        <div className="row">
          <label className="prompt">🦄</label>
          <input
            className="in"
            type="text"
            placeholder="Enter your message and hit Enter"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="send" type="submit" disabled={isStreaming || !apiKey || !input.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

