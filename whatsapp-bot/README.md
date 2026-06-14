# ShehriSaathi — WhatsApp bot (Baileys)

A **standalone, isolated** WhatsApp entry point for ShehriSaathi. It does **not**
import any app code — for every incoming message it calls the same grounded
endpoints the web app uses (`/api/chat`, `/api/transcribe`), so retrieval, the
refusal gate, citations, and Urdu voice all behave identically. It can never
break the web app or the Vercel deploy.

```
WhatsApp user ──▶ Baileys (this process) ──HTTP──▶ ShehriSaathi /api/chat
   (text or                                         /api/transcribe (voice note)
    voice note)  ◀── grounded, cited Urdu reply ◀──
```

## ⚠️ Read this first (honest caveats)

- **Against WhatsApp's Terms.** Baileys automates a normal WhatsApp account via
  the Web protocol. The number can be **banned without warning** — use a
  **spare/secondary number**, never your primary.
- **Not serverless.** It needs a **persistent process**, so it **cannot run on
  Vercel**. Run it locally or on a small always-on VPS.
- **Pairing** is by QR scan; the session is saved in `./auth` (gitignored —
  it contains credentials, never commit it).
- This is a **prototype / roadmap demo**. For production, migrate to the
  official **WhatsApp Cloud API** (Meta) — same `/api/*` reuse, just a webhook.

## Run

1. Start the ShehriSaathi web app somewhere reachable (with `GROQ_API_KEY` set):
   ```bash
   # in the repo root
   npm run dev          # http://localhost:3000
   ```
2. In this folder:
   ```bash
   cd whatsapp-bot
   npm install
   # point at your running app (default http://localhost:3000):
   SHEHRISAATHI_URL=http://localhost:3000 npm start
   ```
3. Scan the QR shown in the terminal: WhatsApp → **Settings → Linked Devices →
   Link a Device**.
4. Message the paired number (text or an Urdu voice note). You'll get the same
   grounded, cited answer the web app gives — and the same Urdu refusal for
   out-of-scope questions.

### Config

| Env var | Default | Meaning |
|---|---|---|
| `SHEHRISAATHI_URL` | `http://localhost:3000` | Base URL of the running ShehriSaathi app |

Groups and WhatsApp status updates are ignored; only 1:1 chats are answered.
