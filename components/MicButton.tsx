"use client";

import { useRef, useState } from "react";

type Status = "idle" | "recording" | "transcribing";

interface MicButtonProps {
  enabled: boolean;
  disabled?: boolean;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
}

export default function MicButton({
  enabled,
  disabled,
  onTranscript,
  onError,
}: MicButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  async function startRecording() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onError("اس براؤزر میں مائیکروفون دستیاب نہیں۔ (Microphone not supported in this browser.)");
      return;
    }
    try {
      // Noise suppression + echo cancellation give Whisper much cleaner audio,
      // which is the main cause of "it heard something else" mistakes.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      // Opus in WebM is the highest-quality format Whisper ingests well.
      const preferred = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];
      const mimeType = preferred.find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopTracks();
        void sendForTranscription();
      };

      recorder.start();
      setStatus("recording");
    } catch {
      stopTracks();
      onError("مائیکروفون کی اجازت نہیں ملی۔ (Microphone permission denied.)");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setStatus("transcribing");
    }
  }

  async function sendForTranscription() {
    const blob = new Blob(chunksRef.current, {
      type: chunksRef.current[0]?.type || "audio/webm",
    });
    if (blob.size === 0) {
      setStatus("idle");
      onError("کوئی آواز ریکارڈ نہیں ہوئی۔ (No audio recorded.)");
      return;
    }

    const form = new FormData();
    form.append("audio", blob, "recording.webm");

    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onError(
          data?.message
            ? `${data.message}`
            : "آواز کو متن میں تبدیل نہیں کیا جا سکا۔ (Could not transcribe.)"
        );
      } else if (data?.text) {
        onTranscript(data.text);
      } else {
        onError("آواز واضح نہیں تھی، دوبارہ کوشش کریں۔ (Could not hear that — try again.)");
      }
    } catch {
      onError("نیٹ ورک کا مسئلہ — دوبارہ کوشش کریں۔ (Network error — try again.)");
    } finally {
      setStatus("idle");
    }
  }

  const isDisabled = !enabled || disabled || status === "transcribing";

  const label = !enabled
    ? "آواز کی سہولت دستیاب نہیں — سرور پر GROQ_API_KEY سیٹ نہیں۔ (Voice disabled: GROQ_API_KEY not configured.)"
    : status === "recording"
    ? "ریکارڈنگ روکیں (Stop recording)"
    : status === "transcribing"
    ? "منتقلی ہو رہی ہے… (Transcribing…)"
    : "آواز میں سوال کریں (Ask by voice)";

  return (
    <button
      type="button"
      onClick={status === "recording" ? stopRecording : startRecording}
      disabled={isDisabled}
      title={label}
      aria-label={label}
      className={[
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition",
        !enabled
          ? "cursor-not-allowed bg-gray-200 text-gray-400"
          : status === "recording"
          ? "recording bg-red-500 text-white"
          : status === "transcribing"
          ? "cursor-wait bg-brand-green/40 text-white"
          : "bg-brand-green text-white hover:bg-brand-greenDark",
      ].join(" ")}
    >
      {status === "transcribing" ? (
        <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : status === "recording" ? (
        "⏹"
      ) : (
        "🎙️"
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
}
