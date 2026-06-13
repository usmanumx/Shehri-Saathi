import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Chunk, DocMeta } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

/** Approx. max characters per chunk. Small docs => keep chunks readable. */
const MAX_CHUNK_CHARS = 600;

function chunkBody(body: string): string[] {
  // Split on blank lines (paragraphs / headings), then greedily pack
  // paragraphs into chunks up to MAX_CHUNK_CHARS so each chunk holds a
  // coherent idea without blowing the token budget.
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current && (current.length + para.length + 1) > MAX_CHUNK_CHARS) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current} ${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Load every /content/*.md file, parse frontmatter, and split into chunks.
 * Returns [] if the directory is missing so the app never crashes on boot.
 */
export function loadChunks(): Chunk[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    console.warn(`[content] No content directory found at ${CONTENT_DIR}`);
    return [];
  }

  const chunks: Chunk[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const id = (data.id as string) || file.replace(/\.md$/, "");

      const meta: DocMeta = {
        id,
        title: (data.title as string) || id,
        source_name: (data.source_name as string) || "Unknown source",
        source_url: (data.source_url as string) || "",
        fetched_at: (data.fetched_at as string) || "",
      };

      const pieces = chunkBody(content);
      pieces.forEach((text, i) => {
        chunks.push({ id: `${id}#${i}`, docId: id, text, meta });
      });
    } catch (err) {
      console.warn(`[content] Failed to load ${file}:`, err);
    }
  }

  return chunks;
}
