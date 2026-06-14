/**
 * ShehriSaathi — WhatsApp entry point (Baileys).
 *
 * DESIGN: this is a standalone, isolated process. It does NOT import any app
 * code. For every incoming WhatsApp message it calls the SAME grounded
 * endpoints the web app uses:
 *   - POST /api/transcribe   (Urdu voice note -> text, via Groq Whisper)
 *   - POST /api/chat         (text -> grounded, cited Urdu answer + refusal)
 * So retrieval, the refusal gate, citations and voice all work identically,
 * and this bot can never break the web app or the Vercel deploy.
 *
 * HONEST CAVEATS (read whatsapp-bot/README.md):
 *  - Baileys automates a normal WhatsApp account via the Web protocol. This is
 *    against WhatsApp's Terms; the number can be banned. Use a SPARE number.
 *  - It needs a persistent process (cannot run on Vercel). Run locally / on a VPS.
 *  - Pairing is by QR scan; the session is stored in ./auth (gitignored).
 *
 * Run:  SHEHRISAATHI_URL=http://localhost:3000 npm start
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";

const BASE_URL = (process.env.SHEHRISAATHI_URL || "http://localhost:3000").replace(/\/$/, "");
const logger = pino({ level: "silent" });

// --- Talk to the SAME backend the web app uses --------------------------------

/** Transcribe a WhatsApp voice note (OGG/Opus) to Urdu text via /api/transcribe. */
async function transcribe(buffer, mimetype) {
  const form = new FormData();
  const type = mimetype || "audio/ogg";
  form.append("audio", new Blob([buffer], { type }), "voice.ogg");
  const res = await fetch(`${BASE_URL}/api/transcribe`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "transcription failed");
  return (data?.text || "").trim();
}

/** Get a grounded, cited Urdu answer from /api/chat (refusal handled server-side). */
async function answer(query) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ query }),
  });
  const text = (await res.text()).trim();

  let citations = [];
  const b64 = res.headers.get("x-citations");
  if (b64) {
    try {
      citations = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    } catch {
      /* ignore malformed header */
    }
  }
  return { text, citations };
}

/** Format the WhatsApp reply: answer + a short, clickable sources list. */
function formatReply({ text, citations }) {
  let out = text || "—";
  if (Array.isArray(citations) && citations.length > 0) {
    const lines = citations
      .slice(0, 3)
      .map((c) => `• ${c.title} — ${c.source_name}\n  ${c.source_url}`)
      .join("\n");
    out += `\n\n📄 *حوالہ جات · Sources*\n${lines}`;
  }
  return out;
}

// --- Extract the user's question from a WhatsApp message ----------------------

function getText(msg) {
  const m = msg.message;
  return (
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    m?.imageMessage?.caption ||
    ""
  ).trim();
}

function getAudio(msg) {
  return msg.message?.audioMessage || null;
}

// --- WhatsApp connection ------------------------------------------------------

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({ version, auth: state, logger, browser: ["ShehriSaathi", "Chrome", "1.0"] });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      console.log("\nScan this QR with WhatsApp (Linked Devices) to pair:\n");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      console.log(`\n✅ Connected. ShehriSaathi WhatsApp bot is live — backend: ${BASE_URL}`);
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(`Connection closed (code ${code}).`, loggedOut ? "Logged out — delete ./auth and re-pair." : "Reconnecting…");
      if (!loggedOut) start();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue;
        const jid = msg.key.remoteJid;
        if (!jid || jid === "status@broadcast" || jid.endsWith("@g.us")) continue; // skip status & groups

        let query = getText(msg);
        const audio = getAudio(msg);

        if (!query && audio) {
          await sock.sendPresenceUpdate("composing", jid);
          const buffer = await downloadMediaMessage(
            msg,
            "buffer",
            {},
            { logger, reuploadRequest: sock.updateMediaMessage }
          );
          query = await transcribe(buffer, audio.mimetype);
          if (query) {
            await sock.sendMessage(jid, { text: `🎙️ آپ نے پوچھا: ${query}` }, { quoted: msg });
          }
        }

        if (!query) {
          await sock.sendMessage(
            jid,
            { text: "السلام علیکم! شہری ساتھی میں خوش آمدید۔ اپنا سوال اردو، Roman Urdu یا English میں لکھیں یا وائس نوٹ بھیجیں۔" },
            { quoted: msg }
          );
          continue;
        }

        await sock.sendPresenceUpdate("composing", jid);
        const result = await answer(query);
        await sock.sendMessage(jid, { text: formatReply(result) }, { quoted: msg });
      } catch (err) {
        console.error("[bot] error handling message:", err?.message || err);
        try {
          await sock.sendMessage(msg.key.remoteJid, {
            text: "معذرت، جواب حاصل کرنے میں مسئلہ ہوا۔ براہِ کرم دوبارہ کوشش کریں۔ (Something went wrong — please try again.)",
          });
        } catch {
          /* ignore */
        }
      }
    }
  });
}

start().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
