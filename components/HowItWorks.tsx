const STEPS = [
  { icon: "🎙️", ur: "آواز میں سوال پوچھیں", en: "Ask by voice" },
  { icon: "📝", ur: "اردو میں منتقلی", en: "Urdu transcription" },
  { icon: "📚", ur: "سرکاری دستاویزات سے تلاش", en: "Search official docs" },
  { icon: "✅", ur: "حوالہ کے ساتھ جواب", en: "Cited Urdu answer" },
];

export default function HowItWorks() {
  return (
    <section
      aria-label="How it works"
      className="mt-6 rounded-2xl border border-brand-green/20 bg-white/70 p-4 shadow-sm"
    >
      <h2 className="mb-3 text-center font-urdu text-base font-semibold text-brand-navy">
        یہ کیسے کام کرتا ہے
      </h2>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((s, i) => (
          <li
            key={i}
            className="flex flex-col items-center rounded-xl bg-brand-cream/70 p-2 text-center"
          >
            <span className="text-xl" aria-hidden>
              {s.icon}
            </span>
            <span className="mt-1 font-urdu text-[13px] leading-snug text-brand-navy">
              {s.ur}
            </span>
            <span className="text-[10px] text-brand-navy/50">{s.en}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
