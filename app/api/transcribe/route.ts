import { NextRequest, NextResponse } from "next/server";
import { toFile } from "groq-sdk";
import { getGroqClient, GROQ_STT_MODEL, MissingKeyError } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Cap upload size so a runaway recording can't blow the serverless limit.
const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  let client;
  try {
    client = getGroqClient();
  } catch (err) {
    if (err instanceof MissingKeyError) {
      return NextResponse.json(
        { error: "transcription_unavailable", message: "GROQ_API_KEY is not configured." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("audio");
    if (f instanceof File) file = f;
  } catch {
    file = null;
  }

  if (!file) {
    return NextResponse.json(
      { error: "no_audio", message: "No audio file received." },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "empty_audio", message: "Empty recording." }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "audio_too_large", message: "Recording is too long." },
      { status: 413 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name && file.name.includes(".") ? file.name : "audio.webm";
    const upload = await toFile(buffer, filename, { type: file.type || "audio/webm" });

    const transcription = await client.audio.transcriptions.create({
      file: upload,
      model: GROQ_STT_MODEL,
      language: "ur",
      temperature: 0,
    });

    return NextResponse.json({ text: (transcription.text ?? "").trim() });
  } catch (err: unknown) {
    console.error("[transcribe] groq error:", err);
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many requests — try again shortly." },
        { status: 429 }
      );
    }
    if (status === 401) {
      return NextResponse.json(
        { error: "transcription_unavailable", message: "Invalid GROQ_API_KEY." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "transcription_failed", message: "Could not transcribe audio." },
      { status: 500 }
    );
  }
}
