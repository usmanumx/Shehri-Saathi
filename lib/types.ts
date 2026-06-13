// Shared types for ShehriSaathi

export interface DocMeta {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  fetched_at: string;
}

export interface Chunk {
  id: string;
  docId: string;
  text: string;
  meta: DocMeta;
}

export interface ScoredChunk {
  chunk: Chunk;
  score: number;
}

/** A citation chip rendered under an answer. */
export interface Citation {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  fetched_at: string;
}

export interface RetrievalResult {
  /** Chunks selected as context for the LLM (already filtered by relevance). */
  chunks: ScoredChunk[];
  /** Unique source documents behind those chunks, for citation chips. */
  citations: Citation[];
  /** Highest BM25 score seen for the query (used for the refusal gate). */
  topScore: number;
  /** True when nothing relevant was found — the answer must be a refusal. */
  outOfScope: boolean;
}
