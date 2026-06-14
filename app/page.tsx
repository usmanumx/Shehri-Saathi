import ChatApp from "@/components/ChatApp";
import HowItWorks from "@/components/HowItWorks";
import Logo from "@/components/Logo";
import { hasGroqKey } from "@/lib/groq";

// Read GROQ_API_KEY at request time (not baked in at build) so the mic state
// reflects the live server env even if the key is added after deploy.
export const dynamic = "force-dynamic";

export default function Home() {
  // Read server-side so the mic can disable gracefully when no key is set,
  // without ever exposing the key to the browser.
  const voiceEnabled = hasGroqKey();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10">
      <header className="pt-9 text-center">
        <div className="inline-flex items-center gap-3.5">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-brand-green/15">
            <Logo className="h-12 w-12" />
          </span>
          <div className="text-right leading-none">
            <h1 className="font-urdu text-[2.4rem] font-bold leading-tight text-brand-navy">
              شہری ساتھی
            </h1>
            <p className="text-base font-bold tracking-tight">
              <span className="text-brand-navy">Shehri</span>
              <span className="text-brand-green">Saathi</span>
            </p>
          </div>
        </div>
        <p className="mt-4 font-urdu text-lg text-brand-navy/80">
          آپ کا شہری معلومات کا ساتھی
        </p>
        <p className="mx-auto mt-2 inline-flex flex-wrap items-center justify-center gap-x-1.5 rounded-full bg-white/60 px-3.5 py-1.5 text-[11px] text-brand-navy/70 ring-1 ring-brand-green/15">
          <span aria-hidden>🛡️</span>
          تصدیق شدہ سرکاری دستاویزات سے اردو میں جوابات
          <span className="text-brand-navy/30">·</span>
          Grounded in official Pakistani documents
        </p>
      </header>

      <HowItWorks />

      <ChatApp voiceEnabled={voiceEnabled} />

      <footer className="mt-8 border-t border-brand-green/15 pt-4 text-center text-[11px] leading-relaxed text-brand-navy/50">
        <span className="font-urdu text-brand-green/80">صحیح معلومات، مضبوط جمہوریت</span>
        {" · "}
        صرف تصدیق شدہ سرکاری دستاویزات سے جوابات
        <br />
        ShehriSaathi may make mistakes. Always confirm important steps with the official source.
      </footer>
    </main>
  );
}
