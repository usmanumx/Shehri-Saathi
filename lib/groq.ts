import Groq from "groq-sdk";

export const GROQ_LLM_MODEL = "llama-3.3-70b-versatile";
export const GROQ_STT_MODEL = "whisper-large-v3-turbo";

/** The exact refusal sentence required by the spec. */
export const REFUSAL_URDU =
  "معاف کیجیے، میرے پاس اس بارے میں تصدیق شدہ معلومات نہیں ہیں۔";

/** Refusal for English / Roman Urdu queries. */
export const REFUSAL_OTHER =
  "Sorry, I don't have verified information about this. " +
  "(Maafi chahta/chahti hoon, is baare mein mere paas tasdeq shuda maloomat nahi hain.)";

/** True when the text is primarily written in Urdu/Arabic script. */
export function isUrduScript(text: string): boolean {
  const arabic = (text.match(/[؀-ۿ]/g) || []).length;
  return arabic / Math.max(text.length, 1) > 0.1;
}

/** Build a system prompt that instructs the LLM to reply in the user's language. */
export function buildSystemPrompt(urduScript: boolean): string {
  const base = [
    'آپ "شہری ساتھی" ہیں، پاکستانی شہریوں کے لیے ایک معلوماتی مددگار۔',
    "صرف نیچے دی گئی تصدیق شدہ معلومات کی بنیاد پر جواب دیں۔ چھوٹے جملے استعمال کریں۔",
    "سب سے پہلے بالکل اسی سوال کا براہِ راست جواب دیں جو پوچھا گیا ہے — غیر متعلقہ تفصیل شامل نہ کریں۔",
    "جہاں ممکن ہو، عملی اقدامات نمبر وار (۱، ۲، ۳) ترتیب سے لکھیں۔ ضروری نمبر، کوڈ یا ویب سائٹ واضح لکھیں۔",
    "جواب مختصر اور جامع رکھیں۔ ایک ہی بات کو بار بار نہ دہرائیں۔",
    "اپنی طرف سے یا عام معلومات سے کوئی بات شامل نہ کریں۔",
    `اگر دی گئی معلومات میں جواب موجود نہ ہو تو یہ جملہ لکھیں: "${REFUSAL_URDU}"`,
  ];
  if (!urduScript) {
    base.push(
      "The user wrote in English or Roman Urdu (Urdu words spelled in English letters). " +
        "Detect their language from the question and reply in THAT SAME language and style. " +
        "Roman Urdu example: 'vote kaise check karein' → answer in Roman Urdu. " +
        "English example: 'how do I check my vote' → answer in English. " +
        "Keep answers short, numbered steps where applicable."
    );
  }
  return base.join("\n");
}

// Keep for any legacy callers.
export const SYSTEM_PROMPT = buildSystemPrompt(true);

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
