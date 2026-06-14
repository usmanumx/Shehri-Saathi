"use client";

/**
 * Services guide — the "what can this help me with?" menu.
 *
 * Shown expanded on the new-chat welcome screen, and available any time from
 * a header button (as a dropdown). Each example question is pickable: clicking
 * it starts the chat with that question.
 *
 * The categories mirror the official documents in /content, so every listed
 * service is actually answerable from the knowledge base.
 */

export interface ServiceCategory {
  id: string;
  icon: string;
  titleUr: string;
  titleEn: string;
  questions: string[];
}

export const SERVICES: ServiceCategory[] = [
  {
    id: "voter-register",
    icon: "🗳️",
    titleUr: "ووٹ کا اندراج",
    titleEn: "Voter registration",
    questions: [
      "میں ووٹ کے لیے کیسے رجسٹر ہو سکتا ہوں؟",
      "ووٹ کے اندراج کے لیے کیا شرائط ہیں؟",
    ],
  },
  {
    id: "voter-check",
    icon: "✅",
    titleUr: "ووٹ کی تصدیق (SMS 8300)",
    titleEn: "Check your registration",
    questions: [
      "میں اپنا ووٹ کیسے چیک کروں؟",
      "8300 پر پیغام کیسے بھیجوں؟",
    ],
  },
  {
    id: "cnic",
    icon: "🪪",
    titleUr: "شناختی کارڈ (CNIC)",
    titleEn: "CNIC / NADRA",
    questions: [
      "شناختی کارڈ بنوانے کے لیے کہاں جاؤں؟",
      "نیا شناختی کارڈ بنوانے کے لیے کیا کاغذات چاہئیں؟",
    ],
  },
  {
    id: "complaint",
    icon: "📢",
    titleUr: "سرکاری شکایت",
    titleEn: "Government complaint",
    questions: [
      "سرکاری شکایت کیسے درج کروں؟",
      "پاکستان سٹیزن پورٹل کیا ہے؟",
    ],
  },
];

export default function ServicesMenu({
  onPick,
  variant = "panel",
}: {
  onPick: (question: string) => void;
  variant?: "panel" | "dropdown";
}) {
  return (
    <div
      className={[
        "grid gap-3",
        variant === "panel" ? "sm:grid-cols-2" : "grid-cols-1",
      ].join(" ")}
    >
      {SERVICES.map((svc) => (
        <div
          key={svc.id}
          className="rounded-2xl border border-brand-green/20 bg-white p-3.5 text-start shadow-sm transition hover:border-brand-green/40 hover:shadow-md"
        >
          <div className="mb-2 flex items-center gap-2.5" dir="rtl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-lg">
              {svc.icon}
            </span>
            <div>
              <p className="font-urdu text-sm font-semibold leading-tight text-brand-navy">
                {svc.titleUr}
              </p>
              <p className="text-[10px] text-brand-navy/50">{svc.titleEn}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5" dir="rtl">
            {svc.questions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onPick(q)}
                className="group flex items-center gap-1.5 rounded-lg bg-brand-cream/60 px-2.5 py-1.5 text-start font-urdu text-[13px] leading-snug text-brand-greenDark transition hover:bg-brand-green/10"
              >
                <span className="text-brand-green/40 transition group-hover:translate-x-[-2px] group-hover:text-brand-green" aria-hidden>
                  ‹
                </span>
                <span className="flex-1">{q}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
