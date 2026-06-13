import ChatApp from "@/components/ChatApp";
import HowItWorks from "@/components/HowItWorks";
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
      <header className="pt-8 text-center">
        <div className="inline-flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green text-2xl text-white shadow">
            🪪
          </span>
          <div className="text-right">
            <h1 className="font-urdu text-3xl font-bold leading-tight text-brand-navy">
              شہری ساتھی
            </h1>
            <p className="text-sm font-semibold tracking-wide text-brand-green">
              ShehriSaathi
            </p>
          </div>
        </div>
        <p className="mt-3 font-urdu text-lg text-brand-navy/80">
          آپ کا شہری معلومات کا ساتھی
        </p>
        <p className="mt-1 text-xs text-brand-navy/60">
          تصدیق شدہ سرکاری دستاویزات سے اردو میں جوابات · Grounded in official Pakistani documents
        </p>
      </header>

      <HowItWorks />

      <ChatApp voiceEnabled={voiceEnabled} />

      <footer className="mt-8 text-center text-[11px] leading-relaxed text-brand-navy/50">
        صحیح معلومات، مضبوط جمہوریت · صرف تصدیق شدہ سرکاری دستاویزات سے جوابات
        <br />
        ShehriSaathi may make mistakes. Always confirm important steps with the official source.
      </footer>
    </main>
  );
}
