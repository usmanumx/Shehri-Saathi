# ShehriSaathi — شہری ساتھی

**آپ کا شہری معلومات کا ساتھی** · A voice-first **Urdu civic-information assistant** for Pakistani citizens, grounded in official government documents — with citations on every answer.

Ask a civic question by **voice or text in Urdu**, and ShehriSaathi answers in **simple Urdu**, using **only** verified content auto-ingested from official Pakistani government sources. If it doesn't have a verified answer, it **refuses** instead of guessing.

---

## 1. Problem statement

Millions of Pakistani citizens — many with low literacy or limited English — struggle to get clear, trustworthy answers to everyday civic questions: *How do I check my vote? Where do I get a CNIC? How do I file a complaint?* The information exists on government websites, but it is scattered, in English, full of jargon, and hard to navigate on a low-end phone.

Meanwhile, **misinformation spreads easily** on chat apps. People forward unverified "steps" that are wrong or scammy.

**ShehriSaathi** closes both gaps:
- **Voice-first, Urdu-first** so low-literacy users can simply *speak* their question.
- **Grounded answers with citations** — every answer is built only from official documents and names its source. Out-of-scope questions are refused, not hallucinated.

## 2. Who benefits

- **Low-literacy / first-time voters** who can speak Urdu but can't easily read English government portals.
- **Rural and low-bandwidth users** on entry-level phones (mobile-first, lightweight UI).
- **Anyone** who wants a quick, *trustworthy* answer to a civic question with a link back to the official source.

## 3. How AI is used — and why it's appropriate

| Step | AI used | Why it fits |
|------|---------|-------------|
| **Voice in** | Groq **Whisper** (`whisper-large-v3-turbo`, `language=ur`) | Urdu speech-to-text removes the literacy barrier — the key differentiator. |
| **Retrieval** | Local **BM25** keyword index (no hosted embeddings) | Free, fast, runs in-process; keeps answers grounded in official text. |
| **Answer** | Groq **LLM** (`llama-3.3-70b-versatile`), streamed | Rewrites verified content into *simple Urdu* for low-literacy readers. |
| **Guardrail** | Prompt-level grounding + a retrieval **refusal gate** | The model may use **only** the retrieved official text and must refuse if the answer isn't there — this is the core anti-misinformation feature. |

AI is appropriate here precisely because the task is *language + accessibility*, not fact invention: the facts come from official documents; the AI only **transcribes, retrieves, and rephrases** — never fabricates.

## 4. How the automated ingestion pipeline works

`npm run ingest` (script: [`scripts/ingest.mjs`](scripts/ingest.mjs)) builds the knowledge base automatically from real official sources:

| id | Source | URL |
|----|--------|-----|
| `voter-register` | Election Commission of Pakistan (ECP) | https://ecp.gov.pk/how-to-register |
| `voter-check` | Election Commission of Pakistan (ECP) | https://ecp.gov.pk/check-your-registration |
| `cnic` | NADRA | https://www.nadra.gov.pk/identityDocument/cnic |
| `complaint` | Pakistan Citizen Portal | https://citizenportal.gov.pk/ |

For each source the script:
1. **Fetches** the page (native `fetch`, **10s timeout**, no headless browser).
2. **Strips** nav/scripts/footer/boilerplate and **extracts** the main readable text with **cheerio**.
3. **Writes** `/content/<id>.md` with frontmatter (`title`, `source_name`, `source_url`, `fetched_at`).

### Resilience & cache fallback (the important part)

Government domains are **frequently blocked or unreachable** from sandboxes and CI. So the pipeline is built to never crash and never lose data:

- If a fetch **times out, returns non-200, is blocked, or yields too little text**, the script logs a clear warning and **keeps the existing committed `/content/<id>.md`**.
- The repo **ships curated, committed cached copies** of all four files (in **Urdu**, so retrieval works offline). **The app always has data with zero network.**
- The run is **safely re-runnable and cache-preserving** (a failed or English fetch never destroys curated data), and prints a summary of *which sources refreshed live, kept their Urdu cache, vs. served from cache after a failure*. By default it never overwrites a curated Urdu file with raw English extraction — use `--translate` to refresh those into Urdu.

> Because `/content` is committed, the **live Vercel deploy needs no server-side ingestion** — it just works.

### Optional translation step

After extraction, the script can rewrite English text into **simple Urdu** via one Groq call per doc:

```bash
npm run ingest -- --translate
```

This is **OFF by default** so it never burns free-tier tokens on a normal run. Docs already in Urdu are skipped automatically.

## 5. Retrieval & grounding

- On first request the server loads all `/content/*.md`, chunks them (~600 chars), and builds an **in-memory BM25 index** (small JS, no vector DB, no hosted embeddings — Groq has no embeddings model).
- Per query it retrieves the **top 4 chunks** and passes them as the **only** allowed context.
- A **refusal gate** drops queries whose best BM25 score is below a threshold → the assistant returns the exact Urdu refusal instead of guessing:
  > معاف کیجیے، میرے پاس اس بارے میں تصدیق شدہ معلومات نہیں ہیں۔
- Each answer renders **citation chips** linking to the official `source_url`, plus a small **"data last refreshed"** date.

---

## 6. Setup & run

### Prerequisites
- Node.js **18.17+** (works great on Node 20/22/24)
- A free **Groq API key** (no credit card): https://console.groq.com/keys

### Install
```bash
npm install
```

### Set the key
```bash
cp .env.example .env.local
# then edit .env.local and paste your key:
# GROQ_API_KEY=gsk_...
```

### Run ingestion (optional — cached content already ships)
```bash
# Fetch live from official sources; falls back to committed cache on failure.
npm run ingest

# Also rewrite extracted English into simple Urdu (uses Groq tokens):
npm run ingest -- --translate
```
> **Live vs. cached:** With network access and reachable government domains, sources **refresh live**. If a domain is blocked/unreachable (common in sandboxes), the script keeps the **committed cached** Urdu copy and says so in its summary. Either way the app has data.

### Run locally
```bash
npm run dev
# open http://localhost:3000
```

Text chat works as soon as `GROQ_API_KEY` is set. The **mic** also needs the key; if it's missing, the mic disables gracefully with a tooltip and **text chat still works**.

---

## 7. Required environment variable

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | yes | The **only** secret. Powers **both** the LLM and Whisper speech-to-text. |

No other provider is used — **Groq only**, one key, no credit card.

## 8. Groq free-tier limits (be kind to the free tier)

- **LLM** (`llama-3.3-70b-versatile`): ~**30 requests/min**, ~**100K tokens/day**, ~12K tokens/min.
- **Whisper** (`whisper-large-v3-turbo`): ~**2,000 audio requests/day**.

This app stays well within those limits by design: retrieval sends **only the top 4 chunks**, context is capped, and the answer is short. If you hit a **429**, the UI shows a friendly Urdu message and never crashes.

---

## 9. Deploy to Vercel

This is a **stateless Next.js app** — no database, no background jobs, no custom server. Streaming Groq/Whisper calls are fast and stay within serverless limits.

1. Push this repo to **GitHub**.
2. On **vercel.com → Add New → Project**, import the repo.
3. Add the environment variable **`GROQ_API_KEY`** (Project → Settings → Environment Variables).
4. **Deploy.** Zero extra config — standard Next.js build.

> Because `/content` is **committed**, the live deploy works **without** running ingestion on the server. To refresh content, run `npm run ingest` locally and commit the updated `/content` files.

---

## 10. DEMO SCRIPT (record this on camera)

Ask these three Urdu questions. The third is **out of scope** and triggers the Urdu refusal — proving the anti-misinformation guardrail.

1. **ووٹ چیک کرنا (in scope → cites ECP):**
   > میں اپنا ووٹ کیسے چیک کروں؟
   *Expected:* simple Urdu steps about SMS-ing your CNIC to **8300**, with an **ECP** citation chip.

2. **شناختی کارڈ (in scope → cites NADRA):**
   > شناختی کارڈ بنوانے کے لیے کہاں جاؤں؟
   *Expected:* go to a **NADRA** Registration Center / Pak Identity, with a **NADRA** citation chip.

3. **آؤٹ آف اسکوپ (refusal — say it out loud):**
   > آج موسم کیسا ہے؟
   *Expected (verbatim):*
   > معاف کیجیے، میرے پاس اس بارے میں تصدیق شدہ معلومات نہیں ہیں۔

**Bonus on camera:** tap the 🎙️ mic, speak question #1 in Urdu, watch it transcribe into the box, then send. Tap **🔊 جواب سنیں** to hear the answer.

---

## 11. Project structure

```
app/
  layout.tsx           # RTL, Noto Nastaliq Urdu font, metadata
  page.tsx             # server component; detects GROQ_API_KEY for mic
  globals.css
  api/
    chat/route.ts      # retrieval + refusal gate + streamed Groq answer (citations in X-Citations header)
    transcribe/route.ts# Groq Whisper (Urdu) speech-to-text
components/
  ChatApp.tsx          # streaming chat UI, voice-out, sample questions
  MicButton.tsx        # browser recording -> /api/transcribe
  Citations.tsx        # source chips + last-refreshed date
  HowItWorks.tsx
lib/
  retrieval.ts         # BM25 index + refusal gate
  content.ts           # load/chunk /content/*.md
  groq.ts              # Groq client, models, system prompt, refusal text
  types.ts
scripts/
  ingest.mjs           # automated, resilient ingestion pipeline
content/                # COMMITTED cached knowledge base (Urdu) — app runs offline
  voter-register.md  voter-check.md  cnic.md  complaint.md
```

## 12. Error handling

- **Missing `GROQ_API_KEY`**: chat returns a friendly Urdu+English message; mic disables with a tooltip; the app never crashes.
- **Groq 429 (rate limit)**: friendly Urdu message, no crash.
- **Network/transcription failure**: handled gracefully in the UI.
- **Out-of-scope question**: deterministic Urdu refusal, no LLM call, no citations.

---

*صحیح معلومات، مضبوط جمہوریت — Correct information, stronger democracy.*

> ShehriSaathi can make mistakes. Always confirm important steps with the official source linked in each citation.
