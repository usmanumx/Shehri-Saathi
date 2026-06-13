import Groq from "groq-sdk";

export const GROQ_LLM_MODEL = "llama-3.3-70b-versatile";
export const GROQ_STT_MODEL = "whisper-large-v3-turbo";

/** The exact refusal sentence required by the spec. */
export const REFUSAL_URDU =
  "معاف کیجیے، میرے پاس اس بارے میں تصدیق شدہ معلومات نہیں ہیں۔";

/**
 * Short system prompt (token-frugal). Grounding + Urdu + citations + refusal.
 * The model must answer ONLY from the supplied context, never general knowledge.
 */
export const SYSTEM_PROMPT = [
  'آپ "شہری ساتھی" ہیں، پاکستانی شہریوں کے لیے ایک معلوماتی مددگار۔',
  "صرف نیچے دی گئی تصدیق شدہ معلومات کی بنیاد پر، سادہ اور آسان اردو میں جواب دیں۔ چھوٹے جملے استعمال کریں۔",
  "اپنی طرف سے یا عام معلومات سے کوئی بات شامل نہ کریں۔",
  "جواب کے آخر میں استعمال شدہ دستاویز کا عنوان حوالہ کے طور پر لکھیں۔",
  `اگر دی گئی معلومات میں جواب موجود نہ ہو تو بالکل یہ جملہ لکھیں: "${REFUSAL_URDU}"`,
].join("\n");

// The .env.example template value — treated as "no key" so the app shows a
// clean no-key state after `cp .env.example .env.local` and before a real
// key is pasted (instead of a mic that looks enabled but 401s).
const PLACEHOLDER_KEY = "your_groq_api_key_here";

function resolveKey(): string {
  const k = process.env.GROQ_API_KEY?.trim() ?? "";
  return k === PLACEHOLDER_KEY ? "" : k;
}

export function hasGroqKey(): boolean {
  return Boolean(resolveKey());
}

/** Lazily build a Groq client; throws a typed error if the key is missing. */
export function getGroqClient(): Groq {
  const apiKey = resolveKey();
  if (!apiKey) {
    throw new MissingKeyError();
  }
  return new Groq({ apiKey });
}

export class MissingKeyError extends Error {
  constructor() {
    super("GROQ_API_KEY is not set");
    this.name = "MissingKeyError";
  }
}
