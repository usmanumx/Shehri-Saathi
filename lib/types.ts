// Shared types for ShehriSaathi

/**
 * Optional structured "official procedure" facts for a document — fees,
 * timeline, required documents, office, province. Rendered as a fee/checklist
 * card so citizens see the OFFICIAL cost and avoid agent overcharging.
 * Every field is optional; docs without a `procedure:` block render normally.
 */
export interface ProcedureInfo {
  fee?: string;
  timeline?: string;
  office?: string;
  province?: string;
  documents?: string[];
}

export interface DocMeta {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  fetched_at: string;
  procedure?: ProcedureInfo;
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
  procedure?: ProcedureInfo;
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
