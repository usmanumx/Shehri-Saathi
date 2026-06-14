"use client";

import { useEffect, useRef, useState } from "react";
import MicButton from "./MicButton";
import Citations from "./Citations";
import ServicesMenu from "./ServicesMenu";
import type { Citation } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

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
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  function stopSpeaking() {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    setSpeakingIdx(null);
  }

  /** Split text into short clauses so Chromium TTS doesn't truncate long answers. */
  function splitForSpeech(text: string): string[] {
    return text
      // Drop the trailing citation line ("حوالہ: …" / "Source: …") — not worth reading aloud.
      .replace(/(^|\n)\s*(حوالہ|ماخذ|source)\s*[:：].*$/gim, "")
      // Break on Urdu/English sentence punctuation and newlines.
      .split(/(?<=[۔؟!?.])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.replace(/[^\p{L}\p{N}]/gu, "").length > 0)
      // Further cap very long clauses (Chromium cuts off around ~200 chars).
      .flatMap((s) => (s.length <= 180 ? [s] : (s.match(/.{1,180}(\s|$)/g) ?? [s])));
  }

  function speak(text: string, idx: number) {
    if (!canSpeak) return;
    // Toggle off if this message is already playing.
    if (speakingIdx === idx) {
      stopSpeaking();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const voices = voicesRef.current.length
        ? voicesRef.current
        : window.speechSynthesis.getVoices();
      const urVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("ur"));
      const isUrdu = /[؀-ۿ]/.test(text);

      const parts = splitForSpeech(text);
      if (parts.length === 0) return;
      setSpeakingIdx(idx);

      parts.forEach((part, i) => {
        const utter = new SpeechSynthesisUtterance(part);
        utter.lang = isUrdu ? "ur-PK" : "en-US";
        if (isUrdu && urVoice) utter.voice = urVoice;
        utter.rate = 0.92;
        // Clear the speaking state only when the final clause finishes.
        if (i === parts.length - 1) {
          utter.onend = () => setSpeakingIdx(null);
          utter.onerror = () => setSpeakingIdx(null);
        }
        window.speechSynthesis.speak(utter);
      });
    } catch {
      setSpeakingIdx(null);
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

  function resetChat() {
    stopSpeaking();
    setMessages([]);
    setInput("");
    setError(null);
  }

  function pickQuestion(q: string) {
    setMenuOpen(false);
    void ask(q);
  }

  const showWelcome = messages.length === 0;

  return (
    <section className="mt-5 flex flex-1 flex-col">
      {/* Toolbar — always-available services/help menu + new-chat reset */}
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand-greenDark shadow-sm transition hover:bg-brand-green/10"
        >
          <span aria-hidden>{menuOpen ? "✕" : "☰"}</span>
          خدمات و مدد
          <span className="text-brand-navy/40">(Services &amp; help)</span>
        </button>
        {!showWelcome && (
          <button
            type="button"
            onClick={resetChat}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-brand-green/30 bg-white px-3 py-1.5 text-xs font-medium text-brand-greenDark transition hover:bg-brand-green/10 disabled:opacity-50"
          >
            ↺ نئی گفتگو (New chat)
          </button>
        )}
      </div>

      {/* Services dropdown — opened from the toolbar, useful mid-conversation */}
      {menuOpen && !showWelcome && (
        <div className="card mb-3 rounded-2xl p-3.5">
          <p className="mb-2.5 text-center font-urdu text-sm font-semibold text-brand-navy">
            میں آپ کی کن چیزوں میں مدد کر سکتا ہوں؟
          </p>
          <ServicesMenu onPick={pickQuestion} />
        </div>
      )}

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="scroll-area card flex-1 space-y-4 overflow-y-auto rounded-2xl p-4"
        style={{ minHeight: "42vh", maxHeight: "55vh" }}
      >
        {showWelcome && (
          <div className="flex h-full flex-col gap-4 py-2">
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10 text-3xl">
                💬
              </span>
              <p className="mt-3 font-urdu text-lg text-brand-navy/90">
                میں آپ کی کن چیزوں میں مدد کر سکتا ہوں؟
              </p>
              <p className="mt-1 text-xs text-brand-navy/50">
                Pick a topic below to start — or ask anything by voice or text. Answers come
                only from official documents.
              </p>
            </div>
            <ServicesMenu onPick={pickQuestion} />
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            dir={/[؀-ۿ]/.test(m.content) ? "rtl" : "ltr"}
            className={m.role === "user" ? "flex justify-start" : "flex justify-end"}
          >
            <div
              className={[
                "bubble-in max-w-[88%] px-4 py-3 shadow-sm",
                m.role === "user"
                  ? "rounded-2xl rounded-bl-md bg-gradient-to-br from-brand-navy to-[#0f274a] text-white"
                  : "rounded-2xl rounded-br-md border border-brand-green/20 bg-white text-brand-navy",
              ].join(" ")}
            >
              <p
                className="answer-body font-urdu text-[15px]"
                dir={/[؀-ۿ]/.test(m.content) || !m.content ? "rtl" : "ltr"}
              >
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
                      onClick={() => speak(m.content, i)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-green hover:text-brand-greenDark"
                    >
                      {speakingIdx === i
                        ? "⏹ روکیں (Stop)"
                        : "🔊 جواب سنیں (Play answer)"}
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
      <div className="mt-3 flex items-end gap-2 rounded-2xl border border-brand-green/25 bg-white p-2 shadow-md focus-within:border-brand-green/50 focus-within:ring-2 focus-within:ring-brand-green/15">
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
          dir={/[؀-ۿ]/.test(input) || input === "" ? "rtl" : "ltr"}
          placeholder="اردو، Roman Urdu، یا English میں سوال لکھیں…"
          className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 font-urdu text-[15px] text-brand-navy outline-none placeholder:text-brand-navy/40"
        />
        <button
          type="button"
          onClick={() => ask(input)}
          disabled={loading || !input.trim()}
          className="btn-brand flex h-11 shrink-0 items-center gap-1 rounded-full px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
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
