import type { Citation } from "@/lib/types";

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Citations({ citations }: { citations: Citation[] }) {
  if (!citations || citations.length === 0) return null;

  // Use the most recent fetched_at across cited docs as the "last refreshed".
  const lastRefreshed = citations
    .map((c) => c.fetched_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div className="mt-3 border-t border-brand-green/15 pt-2">
      <p className="mb-1.5 text-[11px] font-semibold text-brand-navy/60">
        حوالہ جات · Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {citations.map((c) => {
          const chip = (
            <span className="font-urdu leading-tight">{c.title}</span>
          );
          const sub = (
            <span className="mt-0.5 block text-[10px] font-normal text-brand-navy/50">
              {c.source_name}
            </span>
          );
          const className =
            "group inline-flex max-w-full flex-col rounded-lg border border-brand-green/30 bg-brand-green/5 px-3 py-1.5 text-[12px] text-brand-greenDark transition hover:bg-brand-green/10";

          return c.source_url ? (
            <a
              key={c.id}
              href={c.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
              title={`${c.source_name} — ${c.source_url}`}
            >
              {chip}
              {sub}
            </a>
          ) : (
            <span key={c.id} className={className}>
              {chip}
              {sub}
            </span>
          );
        })}
      </div>
      {lastRefreshed && (
        <p className="mt-2 text-[10px] text-brand-navy/40">
          ڈیٹا آخری بار تازہ کیا گیا: {formatDate(lastRefreshed)} · Data last refreshed{" "}
          {formatDate(lastRefreshed)}
        </p>
      )}
    </div>
  );
}
