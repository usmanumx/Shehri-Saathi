const STEPS = [
  { icon: "🎙️", ur: "آواز میں سوال پوچھیں", en: "Ask by voice" },
  { icon: "📝", ur: "اردو میں منتقلی", en: "Urdu transcription" },
  { icon: "📚", ur: "سرکاری دستاویزات سے تلاش", en: "Search official docs" },
  { icon: "✅", ur: "حوالہ کے ساتھ جواب", en: "Cited Urdu answer" },
];

export default function HowItWorks() {
  return (
    <section aria-label="How it works" className="card mt-6 rounded-2xl p-4">
      <h2 className="mb-3 text-center font-urdu text-base font-semibold text-brand-navy">
        یہ کیسے کام کرتا ہے
      </h2>
      <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {STEPS.map((s, i) => (
          <li
            key={i}
            className="group relative flex flex-col items-center rounded-xl bg-gradient-to-b from-white to-brand-cream/60 p-3 text-center ring-1 ring-brand-green/10 transition hover:ring-brand-green/30 hover:shadow-sm"
          >
            <span className="absolute -top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white shadow-sm">
              {i + 1}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green/10 text-lg" aria-hidden>
              {s.icon}
            </span>
            <span className="mt-1.5 font-urdu text-[13px] leading-snug text-brand-navy">
              {s.ur}
            </span>
            <span className="text-[10px] text-brand-navy/50">{s.en}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
