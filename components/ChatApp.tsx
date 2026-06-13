"use client";

import { useEffect, useRef, useState } from "react";
import MicButton from "./MicButton";
import Citations from "./Citations";
import type { Citation } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

const SAMPLE_QUESTIONS = [
  "میں اپنا ووٹ کیسے چیک کروں؟",
  "شناختی کارڈ بنوانے کے لیے کہاں جاؤں؟",
  "سرکاری شکایت کیسے درج کروں؟",
];

function decodeCitations(b64: string | null): Citation[] {
  if (!b64) return [];
  try {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Citation[];
  } catch {
    return [];
  }
}

export default function ChatApp({ voiceEnabled }: { voiceEnabled: boolean }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setCanSpeak(true);
    // getVoices() is empty on first call in Chromium; it populates async.
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function speak(text: string) {
    if (!canSpeak) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ur-PK";
      const voices = voicesRef.current.length
        ? voicesRef.current
        : window.speechSynthesis.getVoices();
      const urVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("ur"));
      if (urVoice) utter.voice = urVoice;
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    } catch {
      /* speech is best-effort; ignore failures */
    }
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    setError(null);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: q },
      { role: "assistant", content: "" },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      const citations = decodeCitations(res.headers.get("X-Citations"));

      if (!res.body) {
        const text = await res.text();
        updateLastAssistant(text || "—", citations);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        updateLastAssistant(acc, citations);
      }
    } catch {
      updateLastAssistant(
        "معذرت، جواب حاصل کرنے میں مسئلہ ہوا۔ (Something went wrong — please try again.)",
        []
      );
    } finally {
      setLoading(false);
    }
  }

  function updateLastAssistant(content: string, citations: Citation[]) {
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === "assistant") {
          next[i] = { ...next[i], content, citations };
          break;
        }
      }
      return next;
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void ask(input);
    }
  }

  const showWelcome = messages.length === 0;

  return (
    <section className="mt-5 flex flex-1 flex-col">
      {/* Conversation */}
      <div
        ref={scrollRef}
        className="scroll-area flex-1 space-y-4 overflow-y-auto rounded-2xl bg-white/60 p-4 shadow-inner"
        style={{ minHeight: "42vh", maxHeight: "55vh" }}
      >
        {showWelcome && (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-6 text-center">
            <p className="font-urdu text-lg text-brand-navy/80">
              اپنا سوال آواز میں یا لکھ کر پوچھیں
            </p>
            <p className="-mt-2 text-xs text-brand-navy/50">
              Ask a civic question by voice or text — answers come only from official documents.
            </p>
            <div className="flex flex-col gap-2">
              {SAMPLE_QUESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-brand-green/30 bg-white px-4 py-2 font-urdu text-sm text-brand-greenDark transition hover:bg-brand-green/10"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-start" : "flex justify-end"}
          >
            <div
              className={[
                "max-w-[88%] rounded-2xl px-4 py-3",
                m.role === "user"
                  ? "bg-brand-navy text-white"
                  : "border border-brand-green/20 bg-white text-brand-navy shadow-sm",
              ].join(" ")}
            >
              <p className="answer-body font-urdu text-[15px]">
                {m.content || (loading ? "" : "—")}
              </p>

              {m.role === "assistant" && !m.content && loading && (
                <span className="inline-flex gap-1 py-1" aria-label="loading">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-green/60 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-green/60 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-green/60" />
                </span>
              )}

              {m.role === "assistant" && m.content && (
                <>
                  {m.citations && m.citations.length > 0 && (
                    <Citations citations={m.citations} />
                  )}
                  {canSpeak && (
                    <button
                      onClick={() => speak(m.content)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-green hover:text-brand-greenDark"
                    >
                      🔊 جواب سنیں (Play answer)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Composer */}
      <div className="mt-3 flex items-end gap-2 rounded-2xl border border-brand-green/30 bg-white p-2 shadow-sm">
        <MicButton
          enabled={voiceEnabled}
          disabled={loading}
          onTranscript={(t) => setInput((prev) => (prev ? `${prev} ${t}` : t))}
          onError={(msg) => setError(msg)}
        />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          dir="rtl"
          placeholder="اپنا سوال یہاں لکھیں…"
          className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 font-urdu text-[15px] text-brand-navy outline-none placeholder:text-brand-navy/40"
        />
        <button
          type="button"
          onClick={() => ask(input)}
          disabled={loading || !input.trim()}
          className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-brand-green px-4 text-sm font-semibold text-white transition hover:bg-brand-greenDark disabled:cursor-not-allowed disabled:bg-brand-green/40"
        >
          {loading ? "…" : "بھیجیں"}
        </button>
      </div>
      <p className="mt-1.5 px-1 text-center text-[10px] text-brand-navy/40">
        Enter سے بھیجیں · Shift+Enter سے نئی سطر
      </p>
    </section>
  );
}
