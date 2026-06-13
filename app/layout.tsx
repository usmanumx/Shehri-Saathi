import type { Metadata, Viewport } from "next";
import { Noto_Nastaliq_Urdu, Noto_Sans } from "next/font/google";
import "./globals.css";

const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-urdu",
  display: "swap",
});

const latin = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-latin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShehriSaathi — شہری ساتھی",
  description:
    "آپ کا شہری معلومات کا ساتھی — تصدیق شدہ سرکاری دستاویزات سے اردو میں جوابات۔ A voice-first Urdu civic assistant for Pakistani citizens, grounded in official documents.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#13315c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ur" dir="rtl" className={`${urdu.variable} ${latin.variable}`}>
      <body className="min-h-screen bg-brand-cream text-brand-navy antialiased">
        {children}
      </body>
    </html>
  );
}
