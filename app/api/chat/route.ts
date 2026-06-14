import { NextRequest } from "next/server";
import { retrieve, buildContextBlock } from "@/lib/retrieval";
import {
  getGroqClient,
  GROQ_LLM_MODEL,
  SYSTEM_PROMPT,
  REFUSAL_URDU,
  MissingKeyError,
} from "@/lib/groq";
import type { Citation } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Streaming Groq calls are fast; keep well within serverless limits.
export const maxDuration = 30;

// Friendly, never-crash error messages (Urdu + English line).
const ERR_NO_KEY =
  "سروس ابھی دستیاب نہیں — سرور پر GROQ_API_KEY سیٹ نہیں کیا گیا۔ (Service unavailable: GROQ_API_KEY is not configured.)";
const ERR_RATE =
  "بہت زیادہ درخواستیں آ رہی ہیں، براہِ کرم تھوڑی دیر بعد دوبارہ کوشش کریں۔ (Rate limit reached — please try again shortly.)";
const ERR_GENERIC =
  "معذرت، جواب حاصل کرنے میں مسئلہ ہوا۔ براہِ کرم دوبارہ کوشش کریں۔ (Something went wrong — please try again.)";

function encodeCitations(citations: Citation[]): string {
  // Base64 so it is header-safe (Urdu titles contain non-ASCII bytes).
  return Buffer.from(JSON.stringify(citations), "utf8").toString("base64");
}

/** Build a streaming Response whose body is plain UTF-8 text. */
function streamText(text: string, citations: Citation[] = [], status = 200): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
  return new Response(stream, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Citations": encodeCitations(citations),
    },
  });
}

export async function POST(req: NextRequest) {
  let query = "";
  try {
    const body = await req.json();
    // Cap length before BM25 + Groq so a pasted mega-string can't burn tokens.
    query = typeof body?.query === "string" ? body.query.trim().slice(0, 2000) : "";
  } catch {
    query = "";
  }

  if (!query) {
    return streamText("براہِ کرم اپنا سوال لکھیں۔ (Please enter a question.)", [], 400);
  }

  // 1) Local retrieval (no API key needed) + refusal gate.
  const { chunks, citations, outOfScope } = retrieve(query);

  if (outOfScope) {
    // Out-of-scope: refuse deterministically, no LLM call, no citations.
    return streamText(REFUSAL_URDU, []);
  }

  // 2) Stream the grounded answer from Groq.
  let client;
  try {
    client = getGroqClient();
  } catch (err) {
    if (err instanceof MissingKeyError) {
      return streamText(ERR_NO_KEY, [], 503);
    }
    return streamText(ERR_GENERIC, [], 500);
  }

  const contextBlock = buildContextBlock(chunks);
  const userMessage = `سوال: ${query}\n\nتصدیق شدہ معلومات:\n${contextBlock}`;

  try {
    const completion = await client.chat.completions.create({
      model: GROQ_LLM_MODEL,
      temperature: 0.3,
      max_tokens: 700,
      // Discourage the model from looping/echoing overlapping context chunks.
      frequency_penalty: 0.5,
      presence_penalty: 0.3,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const part of completion) {
            const token = part.choices?.[0]?.delta?.content ?? "";
            if (token) controller.enqueue(encoder.encode(token));
          }
        } catch (streamErr) {
          console.error("[chat] stream error:", streamErr);
          controller.enqueue(encoder.encode("\n\n" + ERR_GENERIC));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Citations": encodeCitations(citations),
      },
    });
  } catch (err: unknown) {
    console.error("[chat] groq error:", err);
    const status = (err as { status?: number })?.status;
    if (status === 429) return streamText(ERR_RATE, [], 429);
    if (status === 401) return streamText(ERR_NO_KEY, [], 401);
    return streamText(ERR_GENERIC, [], 500);
  }
}
