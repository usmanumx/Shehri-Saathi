import { loadChunks } from "./content";
import type { Chunk, Citation, RetrievalResult, ScoredChunk } from "./types";

// ---------------------------------------------------------------------------
// Tokenizer — works for both Urdu (RTL, no casing) and Latin script.
// Keep unicode letters/numbers, drop everything else, split on whitespace.
// ---------------------------------------------------------------------------
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t));
}

// Small, high-frequency stopword set (Urdu + English) to cut BM25 noise.
const STOPWORDS = new Set<string>([
  // English
  "the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "is", "are",
  "be", "how", "do", "i", "you", "my", "your", "can", "what", "where", "when",
  // Urdu function words
  "میں", "کے", "کی", "کا", "کو", "سے", "پر", "ہے", "ہیں", "اور", "یا", "کہ",
  "یہ", "وہ", "اس", "ان", "ہو", "گا", "گی", "گے", "تو", "بھی", "ایک", "آپ",
  // interrogatives / quantity words — carry no topical content
  "کیا", "کیسے", "کہاں", "کون", "کونسا", "کب", "کیوں", "کتنا", "کتنی", "کتنے",
  "مجھے", "میرا", "میری", "میرے",
]);

// ---------------------------------------------------------------------------
// BM25 ranking over the chunk set.
// ---------------------------------------------------------------------------
class BM25Index {
  private readonly chunks: Chunk[];
  private readonly docTokens: string[][];
  private readonly tf: Map<string, number>[];
  private readonly df: Map<string, number> = new Map();
  private readonly avgLen: number;
  private readonly N: number;
  private readonly k1 = 1.5;
  private readonly b = 0.75;

  constructor(chunks: Chunk[]) {
    this.chunks = chunks;
    this.docTokens = chunks.map((c) => tokenize(c.text));
    this.N = chunks.length;

    this.tf = this.docTokens.map((toks) => {
      const m = new Map<string, number>();
      for (const t of toks) m.set(t, (m.get(t) ?? 0) + 1);
      return m;
    });

    for (const m of this.tf) {
      for (const term of m.keys()) {
        this.df.set(term, (this.df.get(term) ?? 0) + 1);
      }
    }

    const totalLen = this.docTokens.reduce((s, t) => s + t.length, 0);
    this.avgLen = this.N > 0 ? totalLen / this.N : 0;
  }

  private idf(term: string): number {
    const n = this.df.get(term) ?? 0;
    // BM25 idf with +1 smoothing so it never goes negative.
    return Math.log(1 + (this.N - n + 0.5) / (n + 0.5));
  }

  private scoreDoc(queryTerms: string[], idx: number): number {
    const len = this.docTokens[idx].length;
    const tf = this.tf[idx];
    let score = 0;
    for (const term of queryTerms) {
      const f = tf.get(term) ?? 0;
      if (f === 0) continue;
      const denom = f + this.k1 * (1 - this.b + (this.b * len) / (this.avgLen || 1));
      score += this.idf(term) * ((f * (this.k1 + 1)) / denom);
    }
    return score;
  }

  search(query: string, topK: number): ScoredChunk[] {
    const queryTerms = [...new Set(tokenize(query))];
    if (queryTerms.length === 0) return [];

    return this.chunks
      .map((chunk, i) => ({ chunk, score: this.scoreDoc(queryTerms, i) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /** How many DISTINCT query terms exist anywhere in the corpus vocabulary. */
  corpusMatchCount(query: string): number {
    const terms = [...new Set(tokenize(query))];
    return terms.filter((t) => (this.df.get(t) ?? 0) > 0).length;
  }

  get size() {
    return this.N;
  }
}

// ---------------------------------------------------------------------------
// Singleton — build the index once per server process.
// ---------------------------------------------------------------------------
let cachedIndex: BM25Index | null = null;

function getIndex(): BM25Index {
  if (!cachedIndex) {
    const chunks = loadChunks();
    cachedIndex = new BM25Index(chunks);
    console.log(`[retrieval] Indexed ${chunks.length} chunks from official docs.`);
  }
  return cachedIndex;
}

/** Number of top chunks to feed the LLM — keep small for free-tier budget. */
const TOP_K = 4;

/**
 * Refusal gate — two conditions must BOTH hold for a query to be in-scope:
 *
 *  1. topScore >= RELEVANCE_THRESHOLD — a basic BM25 score floor.
 *  2. corpusMatchCount >= MIN_DISTINCT_MATCHES — the query shares at least
 *     two distinct content words with the knowledge base.
 *
 * Condition (2) is the key anti-misinformation guard. A single BM25 score
 * threshold is fooled by out-of-scope queries that happen to contain ONE
 * incidental word also present in the docs (e.g. "پاکستان" in a cricket
 * question, or "بتائیں" in a recipe question). Requiring two distinct
 * matching terms cleanly separates real civic questions (which match
 * multiple content words) from those coincidental single-word hits.
 */
const RELEVANCE_THRESHOLD = 1.0;
const MIN_DISTINCT_MATCHES = 2;

export function retrieve(query: string): RetrievalResult {
  const index = getIndex();
  const scored = index.search(query, TOP_K);

  const topScore = scored.length > 0 ? scored[0].score : 0;
  const matchCount = index.corpusMatchCount(query);
  const outOfScope =
    scored.length === 0 ||
    topScore < RELEVANCE_THRESHOLD ||
    matchCount < MIN_DISTINCT_MATCHES;

  if (outOfScope) {
    return { chunks: [], citations: [], topScore, outOfScope: true };
  }

  // Unique source docs (in score order) for citation chips.
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const { chunk } of scored) {
    if (seen.has(chunk.docId)) continue;
    seen.add(chunk.docId);
    citations.push({
      id: chunk.meta.id,
      title: chunk.meta.title,
      source_name: chunk.meta.source_name,
      source_url: chunk.meta.source_url,
      fetched_at: chunk.meta.fetched_at,
    });
  }

  return { chunks: scored, citations, topScore, outOfScope: false };
}

/** Build the context block passed to the LLM as the ONLY allowed source. */
export function buildContextBlock(chunks: ScoredChunk[]): string {
  return chunks
    .map(({ chunk }, i) => {
      return `【دستاویز ${i + 1}: ${chunk.meta.title} — ${chunk.meta.source_name}】\n${chunk.text}`;
    })
    .join("\n\n");
}
