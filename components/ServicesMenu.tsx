"use client";

/**
 * Services guide — the "what can this help me with?" menu.
 *
 * Shown expanded on the new-chat welcome screen, and available any time from
 * a header button (as a dropdown). Each example question is pickable: clicking
 * it starts the chat with that question.
 *
 * Services are grouped into labelled categories so the (now 18-topic) guide
 * stays scannable. Every listed service mirrors an official document in
 * /content, so it is actually answerable from the knowledge base.
 */

export interface ServiceCategory {
  id: string;
  group: string;
  icon: string;
  titleUr: string;
  titleEn: string;
  questions: string[];
}

/** Category groups, in display order. */
export const GROUPS: { id: string; titleUr: string; titleEn: string }[] = [
  { id: "identity", titleUr: "شناخت و دستاویزات", titleEn: "Identity & documents" },
  { id: "voting", titleUr: "ووٹ", titleEn: "Voting" },
  { id: "civil", titleUr: "خاندانی اندراجات", titleEn: "Civil registration" },
  { id: "vehicle", titleUr: "گاڑی و لائسنس", titleEn: "Vehicle & licence" },
  { id: "business", titleUr: "کاروبار و ٹیکس", titleEn: "Business & tax" },
  { id: "property", titleUr: "جائیداد و اسٹامپ", titleEn: "Property & stamp" },
  { id: "other", titleUr: "دیگر خدمات", titleEn: "Other services" },
];

export const SERVICES: ServiceCategory[] = [
  // --- Identity & documents ---
  {
    id: "cnic",
    group: "identity",
    icon: "🪪",
    titleUr: "شناختی کارڈ (CNIC)",
    titleEn: "CNIC / NADRA",
    questions: [
      "شناختی کارڈ بنوانے کے لیے کہاں جاؤں؟",
      "نیا شناختی کارڈ بنوانے کے لیے کیا کاغذات چاہئیں؟",
    ],
  },
  {
    id: "passport",
    group: "identity",
    icon: "🛂",
    titleUr: "پاسپورٹ (MRP)",
    titleEn: "Passport",
    questions: [
      "پاسپورٹ کے لیے کون سے کاغذات چاہئیں؟",
      "پاسپورٹ کی فیس اور وقت کتنا ہے؟",
    ],
  },
  {
    id: "domicile",
    group: "identity",
    icon: "📜",
    titleUr: "ڈومیسائل سرٹیفکیٹ",
    titleEn: "Domicile",
    questions: [
      "ڈومیسائل سرٹیفکیٹ کیسے بنواؤں؟",
      "ڈومیسائل کے لیے کیا کاغذات چاہئیں؟",
    ],
  },

  // --- Voting ---
  {
    id: "voter-register",
    group: "voting",
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
    group: "voting",
    icon: "✅",
    titleUr: "ووٹ کی تصدیق (SMS 8300)",
    titleEn: "Check your registration",
    questions: [
      "میں اپنا ووٹ کیسے چیک کروں؟",
      "8300 پر پیغام کیسے بھیجوں؟",
    ],
  },

  // --- Civil registration ---
  {
    id: "birth-certificate",
    group: "civil",
    icon: "👶",
    titleUr: "پیدائش کا سرٹیفکیٹ",
    titleEn: "Birth certificate",
    questions: [
      "بچے کا پیدائشی سرٹیفکیٹ کیسے بنواؤں؟",
      "نادرا سے ب-فارم کیسے بنتا ہے؟",
    ],
  },
  {
    id: "marriage-registration",
    group: "civil",
    icon: "💍",
    titleUr: "نکاح رجسٹریشن",
    titleEn: "Marriage registration",
    questions: [
      "نکاح رجسٹریشن سرٹیفکیٹ کیسے بنواؤں؟",
      "شادی کا سرٹیفکیٹ کیسے بنتا ہے؟",
    ],
  },
  {
    id: "death-certificate",
    group: "civil",
    icon: "🕊️",
    titleUr: "موت کا سرٹیفکیٹ",
    titleEn: "Death certificate",
    questions: [
      "موت کا سرٹیفکیٹ کیسے بنواؤں؟",
      "ڈیتھ سرٹیفکیٹ کے لیے کیا کاغذات چاہئیں؟",
    ],
  },

  // --- Vehicle & licence ---
  {
    id: "vehicle-transfer",
    group: "vehicle",
    icon: "🚗",
    titleUr: "گاڑی کی منتقلی",
    titleEn: "Vehicle transfer",
    questions: [
      "گاڑی کی منتقلی کیسے کرواؤں؟",
      "گاڑی کی منتقلی کے لیے کیا کاغذات چاہئیں؟",
    ],
  },
  {
    id: "vehicle-registration",
    group: "vehicle",
    icon: "🚙",
    titleUr: "گاڑی کی رجسٹریشن",
    titleEn: "Vehicle registration",
    questions: [
      "نئی گاڑی کی رجسٹریشن کیسے کرواؤں؟",
      "گاڑی رجسٹریشن کی فیس کتنی ہے؟",
    ],
  },
  {
    id: "driving-license",
    group: "vehicle",
    icon: "🚦",
    titleUr: "ڈرائیونگ لائسنس",
    titleEn: "Driving licence",
    questions: [
      "ڈرائیونگ لائسنس کیسے بنواؤں؟",
      "لرنر لائسنس کیسے ملے گا؟",
    ],
  },

  // --- Business & tax ---
  {
    id: "ntn-income-tax",
    group: "business",
    icon: "🧾",
    titleUr: "NTN / انکم ٹیکس",
    titleEn: "NTN / income tax",
    questions: [
      "NTN رجسٹریشن کیسے کریں؟",
      "ٹیکس رجسٹریشن کے لیے کیا چاہیے؟",
    ],
  },
  {
    id: "company-registration",
    group: "business",
    icon: "🏢",
    titleUr: "کمپنی رجسٹریشن",
    titleEn: "Company registration",
    questions: [
      "کمپنی رجسٹریشن کیسے کریں؟",
      "کاروبار رجسٹریشن کا طریقہ کیا ہے؟",
    ],
  },

  // --- Property & stamp ---
  {
    id: "property-mutation",
    group: "property",
    icon: "🏠",
    titleUr: "جائیداد کا انتقال",
    titleEn: "Property mutation",
    questions: [
      "جائیداد کا انتقال کیسے کرواؤں؟",
      "انتقال کے لیے کیا کاغذات چاہئیں؟",
    ],
  },
  {
    id: "e-stamping",
    group: "property",
    icon: "🖊️",
    titleUr: "ای-اسٹامپنگ",
    titleEn: "E-stamping",
    questions: [
      "اسٹامپ ڈیوٹی آن لائن کیسے ادا کریں؟",
      "ای-اسٹامپ چلان کیسے بنتا ہے؟",
    ],
  },

  // --- Other services ---
  {
    id: "character-certificate",
    group: "other",
    icon: "📋",
    titleUr: "کریکٹر سرٹیفکیٹ",
    titleEn: "Character certificate",
    questions: [
      "پولیس کریکٹر سرٹیفکیٹ کیسے بنواؤں؟",
      "کریکٹر سرٹیفکیٹ کے لیے کیا کاغذات چاہئیں؟",
    ],
  },
  {
    id: "arms-license",
    group: "other",
    icon: "🛡️",
    titleUr: "اسلحہ لائسنس",
    titleEn: "Arms licence",
    questions: [
      "اسلحہ لائسنس کیسے بنواؤں؟",
      "اسلحہ لائسنس کی فیس کتنی ہے؟",
    ],
  },
  {
    id: "complaint",
    group: "other",
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
  const gridCols = variant === "panel" ? "sm:grid-cols-2" : "grid-cols-1";

  return (
    <div className="space-y-4">
      {GROUPS.map((g) => {
        const items = SERVICES.filter((s) => s.group === g.id);
        if (items.length === 0) return null;
        return (
          <div key={g.id}>
            {/* Category heading */}
            <div className="mb-2 flex items-center gap-2" dir="rtl">
              <span className="font-urdu text-xs font-semibold text-brand-navy/70">
                {g.titleUr}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-brand-navy/40">
                {g.titleEn}
              </span>
              <span className="h-px flex-1 bg-brand-green/15" />
            </div>

            <div className={["grid gap-3", gridCols].join(" ")}>
              {items.map((svc) => (
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
                        <span
                          className="text-brand-green/40 transition group-hover:translate-x-[-2px] group-hover:text-brand-green"
                          aria-hidden
                        >
                          ‹
                        </span>
                        <span className="flex-1">{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
