#!/usr/bin/env node
/**
 * ShehriSaathi — automated ingestion pipeline.
 *
 * Builds the knowledge base by fetching official Pakistani government pages,
 * stripping boilerplate, extracting readable civic text, and writing one
 * Markdown file per source into /content with frontmatter.
 *
 * RESILIENCE: if any fetch fails (timeout, non-200, blocked, unreachable),
 * the existing committed /content/<id>.md is KEPT and we move on. The repo
 * ships curated cached copies so the app always has data with zero network.
 *
 * Usage:
 *   npm run ingest                # fetch live, fall back to committed cache
 *   npm run ingest -- --translate # also rewrite English -> simple Urdu (Groq)
 *
 * The --translate step is OFF by default so it never burns free-tier tokens.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");

const FETCH_TIMEOUT_MS = 10_000;
const MIN_USEFUL_CHARS = 200; // below this we assume the page was blocked/empty
const TRANSLATE = process.argv.includes("--translate");

// --- Official sources (real Pakistani government pages) --------------------
const SOURCES = [
  {
    id: "voter-register",
    title: "ووٹ کا اندراج کیسے کروائیں",
    source_name: "الیکشن کمیشن آف پاکستان (ECP)",
    url: "https://ecp.gov.pk/how-to-register",
  },
  {
    id: "voter-check",
    title: "اپنے ووٹ کے اندراج کی تصدیق (SMS 8300)",
    source_name: "الیکشن کمیشن آف پاکستان (ECP)",
    url: "https://ecp.gov.pk/check-your-registration",
  },
  {
    id: "cnic",
    title: "قومی شناختی کارڈ (CNIC) کیسے بنوائیں",
    source_name: "نادرا (NADRA)",
    url: "https://www.nadra.gov.pk/identityDocument/cnic",
  },
  {
    id: "complaint",
    title: "سرکاری شکایت کیسے درج کروائیں (پاکستان سٹیزن پورٹل)",
    source_name: "پاکستان سٹیزن پورٹل (Pakistan Citizen Portal)",
    url: "https://citizenportal.gov.pk/",
  },
];

// --- Tiny .env.local loader (no dotenv dependency) -------------------------
function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    // Strip an unquoted trailing "# comment", then surrounding quotes.
    if (!/^["']/.test(val)) val = val.replace(/\s+#.*$/, "").trim();
    val = val.replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

// --- Fetch with timeout ----------------------------------------------------
async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ShehriSaathiBot/1.0; +civic-info)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// --- Extract main readable text from HTML ----------------------------------
function extractText(html) {
  const $ = cheerio.load(html);

  // Drop non-content elements.
  $(
    "script, style, noscript, nav, header, footer, form, iframe, svg, " +
      "aside, button, input, select, .nav, .navbar, .menu, .footer, " +
      ".header, .sidebar, .breadcrumb, [role=navigation]"
  ).remove();

  // Prefer a main content container if present.
  const candidates = ["main", "article", "#content", ".content", ".main", "body"];
  let root = null;
  for (const sel of candidates) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 120) {
      root = el;
      break;
    }
  }
  if (!root) root = $("body");

  // Collect block-level text, keeping paragraph breaks.
  const blocks = [];
  root.find("h1, h2, h3, h4, li, p, td").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t && t.length > 2) blocks.push(t);
  });

  // De-duplicate consecutive repeats (common in nav-heavy gov templates).
  const seen = new Set();
  const lines = [];
  for (const b of blocks) {
    if (seen.has(b)) continue;
    seen.add(b);
    lines.push(b);
  }

  return lines.join("\n\n").trim();
}

// --- Optional Groq translation: English -> simple Urdu ---------------------
function looksUrdu(text) {
  const arabic = (text.match(/[؀-ۿ]/g) || []).length;
  return arabic / Math.max(text.length, 1) > 0.25;
}

async function translateToUrdu(text) {
  let apiKey = process.env.GROQ_API_KEY?.trim();
  if (apiKey === "your_groq_api_key_here") apiKey = ""; // .env.example placeholder
  if (!apiKey) {
    // No key: signal failure so the caller can preserve the curated cache
    // instead of clobbering it with untranslated English.
    return null;
  }
  const { default: Groq } = await import("groq-sdk");
  const client = new Groq({ apiKey });
  const clipped = text.slice(0, 6000); // keep within token budget
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 1500,
    messages: [
      {
        role: "system",
        content:
          "آپ ایک مترجم ہیں۔ دیے گئے متن کو سادہ، آسان اردو میں دوبارہ لکھیں۔ چھوٹے جملے استعمال کریں۔ اپنی طرف سے کوئی نئی معلومات شامل نہ کریں — صرف وہی بات لکھیں جو متن میں موجود ہے۔",
      },
      { role: "user", content: clipped },
    ],
  });
  return completion.choices?.[0]?.message?.content?.trim() || text;
}

// --- Write a content file with frontmatter ---------------------------------
function writeDoc(src, body) {
  const fetchedAt = new Date().toISOString();
  const frontmatter =
    `---\n` +
    `title: ${src.title}\n` +
    `source_name: ${src.source_name}\n` +
    `source_url: ${src.url}\n` +
    `fetched_at: ${fetchedAt}\n` +
    `---\n\n`;
  fs.writeFileSync(path.join(CONTENT_DIR, `${src.id}.md`), frontmatter + body + "\n", "utf8");
}

// --- Main ------------------------------------------------------------------
async function main() {
  loadEnvLocal();
  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  console.log("ShehriSaathi ingestion");
  console.log(`  translate: ${TRANSLATE ? "ON" : "off"}`);
  console.log("");

  const summary = { live: [], cache: [], preserved: [] };

  for (const src of SOURCES) {
    const target = path.join(CONTENT_DIR, `${src.id}.md`);
    const hasCache = fs.existsSync(target);
    process.stdout.write(`• ${src.id} … `);

    try {
      const res = await fetchWithTimeout(src.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      let text = extractText(html);

      if (text.length < MIN_USEFUL_CHARS) {
        throw new Error(`extracted only ${text.length} chars (blocked/empty?)`);
      }

      if (!looksUrdu(text)) {
        if (TRANSLATE) {
          const translated = await translateToUrdu(text);
          if (translated) {
            text = translated;
            console.log("translated to Urdu");
          } else if (hasCache) {
            summary.preserved.push(src.id);
            console.log("↩ translation unavailable (no GROQ_API_KEY); kept curated Urdu cache");
            continue;
          } else {
            console.log("⚠ translation unavailable (no GROQ_API_KEY); wrote raw English");
          }
        } else if (hasCache) {
          // DEMO-SAFETY GUARD: the live page is English. Overwriting a curated
          // Urdu cache with raw English would break Urdu retrieval (BM25 keyword
          // overlap) and answer quality. Keep the Urdu cache; refresh in Urdu
          // only when the user explicitly opts in with --translate.
          summary.preserved.push(src.id);
          console.log("↩ live page is English; kept curated Urdu cache (use --translate to refresh in Urdu)");
          continue;
        } else {
          // New source, no curated cache to protect: write English but warn.
          console.log("⚠ wrote raw English (no cache yet) — run with --translate to produce Urdu");
        }
      }

      writeDoc(src, text);
      summary.live.push(src.id);
      console.log(`✓ refreshed live (${text.length} chars)`);
    } catch (err) {
      if (hasCache) {
        summary.cache.push(src.id);
        console.log(`⚠ fetch failed (${err.message}) — kept committed cache`);
      } else {
        console.log(`✗ fetch failed (${err.message}) and NO cache present!`);
      }
    }
  }

  console.log("\n── Summary ─────────────────────────────");
  console.log(`  refreshed live   : ${summary.live.length ? summary.live.join(", ") : "none"}`);
  console.log(`  kept Urdu cache  : ${summary.preserved.length ? summary.preserved.join(", ") : "none"}`);
  console.log(`  served from cache: ${summary.cache.length ? summary.cache.join(", ") : "none"}`);
  console.log("─────────────────────────────────────────");
  if (summary.preserved.length > 0) {
    console.log(
      "  Note: some live pages are in English. To refresh those into simple\n" +
        "  Urdu (recommended for the demo), run: npm run ingest -- --translate"
    );
  }
  if (summary.live.length === 0 && summary.preserved.length === 0) {
    console.log(
      "  Note: government domains are often blocked in sandboxes.\n" +
        "  That is exactly why committed cached /content ships with the repo."
    );
  }
}

main().catch((err) => {
  console.error("Ingestion crashed unexpectedly:", err);
  process.exit(1);
});
