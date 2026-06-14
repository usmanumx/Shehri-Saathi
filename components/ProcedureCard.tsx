import type { Citation } from "@/lib/types";

/**
 * "Official fees & checklist" card — surfaces the structured procedure facts
 * (fee, timeline, office, province, required documents) for a cited document.
 *
 * The whole point: show the OFFICIAL cost up front so citizens know they can
 * do it themselves and aren't overcharged by agents. Only renders when the
 * cited doc carries a `procedure` block, so it never affects other answers.
 */
export default function ProcedureCard({ citation }: { citation: Citation }) {
  const p = citation.procedure;
  if (!p) return null;

  const rows: { icon: string; labelUr: string; labelEn: string; value?: string }[] = [
    { icon: "💳", labelUr: "سرکاری فیس", labelEn: "Official fee", value: p.fee },
    { icon: "⏱️", labelUr: "متوقع وقت", labelEn: "Timeline", value: p.timeline },
    { icon: "🏢", labelUr: "کہاں جائیں", labelEn: "Where", value: p.office },
    { icon: "📍", labelUr: "علاقہ", labelEn: "Coverage", value: p.province },
  ].filter((r) => r.value);

  if (rows.length === 0 && (!p.documents || p.documents.length === 0)) return null;

  return (
    <div
      dir="rtl"
      className="mt-3 overflow-hidden rounded-xl border border-brand-green/25 bg-gradient-to-b from-brand-green/[0.06] to-white"
    >
      <div className="flex items-center gap-1.5 border-b border-brand-green/15 bg-brand-green/10 px-3 py-1.5">
        <span aria-hidden>📋</span>
        <span className="font-urdu text-[13px] font-semibold text-brand-greenDark">
          سرکاری فیس اور ضروری کاغذات
        </span>
        <span className="text-[10px] font-normal text-brand-navy/45">
          · Official fees &amp; checklist
        </span>
      </div>

      <div className="space-y-2.5 px-3 py-2.5">
        {rows.length > 0 && (
          <dl className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.labelEn} className="flex items-start gap-1.5">
                <span className="mt-0.5 text-sm" aria-hidden>
                  {r.icon}
                </span>
                <div>
                  <dt className="font-urdu text-[11px] leading-none text-brand-navy/55">
                    {r.labelUr}
                    <span className="ml-1 font-sans text-[9px] text-brand-navy/40">
                      {r.labelEn}
                    </span>
                  </dt>
                  <dd className="mt-0.5 font-urdu text-[13px] font-medium leading-snug text-brand-navy">
                    {r.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        )}

        {p.documents && p.documents.length > 0 && (
          <div>
            <p className="mb-1 font-urdu text-[11px] text-brand-navy/55">
              ضروری کاغذات
              <span className="ml-1 font-sans text-[9px] text-brand-navy/40">
                Documents to bring
              </span>
            </p>
            <ul className="space-y-0.5">
              {p.documents.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5 font-urdu text-[13px] leading-snug text-brand-navy">
                  <span className="mt-0.5 shrink-0 text-brand-green" aria-hidden>
                    ✓
                  </span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="rounded-md bg-brand-cream/70 px-2 py-1 text-center font-urdu text-[11px] leading-snug text-brand-greenDark">
          💡 یہ کام آپ خود کر سکتے ہیں — ایجنٹ کو اضافی پیسے دینے کی ضرورت نہیں۔
          <span className="block font-sans text-[9px] text-brand-navy/45">
            You can do this yourself — no agent overcharging needed. Always confirm the
            latest fee at the official source above.
          </span>
        </p>
      </div>
    </div>
  );
}
