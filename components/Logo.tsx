/**
 * ShehriSaathi brand mark.
 *
 * Prefers the real raster artwork at /public/logo-mark.png when present;
 * otherwise renders a clean SVG fallback (open green ring + chat-bubble tail,
 * two people cradled by an open hand) using the exact brand palette.
 *
 * To use your exact logo: save the mark (just the icon, transparent or white
 * background) as  public/logo-mark.png  — the header will pick it up
 * automatically. No code change needed.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="ShehriSaathi logo"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Open green ring + speech-bubble tail (bottom-left) */}
      <path
        d="M50 11
           a39 39 0 1 1 -28 11.8
           L11.5 31 l5 -14"
        stroke="#1f7a3d"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Two people standing side by side (full head + torso so they don't
          read as a pair of eyes). Navy in front, green slightly behind. */}
      {/* Green person (back) */}
      <circle cx="60" cy="34" r="8" fill="#1f7a3d" />
      <path d="M48 70 V58 a12 12 0 0 1 24 0 V70 Z" fill="#1f7a3d" />
      {/* Navy person (front) */}
      <circle cx="41" cy="37" r="9" fill="#13315c" />
      <path d="M27 72 V60 a14 14 0 0 1 28 0 V72 Z" fill="#13315c" />

      {/* Open cupping hand: a shallow bowl hugging the figures' base. */}
      <path
        d="M21 67 Q50 86 79 67"
        stroke="#1f7a3d"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
