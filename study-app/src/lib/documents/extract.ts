// ============================================================
// Document Text Extraction
// Uses unpdf (pure JS, no DOM dependency — works on Vercel)
// ============================================================

import type { DocumentChunk } from './types'

/**
 * Extract text from a PDF buffer using unpdf (no DOMMatrix needed).
 */
export async function extractPdfText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const { extractText } = await import('unpdf')
  const uint8 = new Uint8Array(buffer)

  const { text, totalPages } = await extractText(uint8, { mergePages: true })

  return { text, pageCount: totalPages }
}

/**
 * Estimate token count (rough: ~4 chars per token for Portuguese)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/**
 * Chunk text into smaller pieces for search and context injection.
 * Uses a simple paragraph-based splitting strategy.
 */
export function chunkText(
  text: string,
  options: { maxTokens?: number; overlap?: number } = {}
): Omit<DocumentChunk, 'id' | 'document_id' | 'user_id' | 'created_at'>[] {
  const { maxTokens = 500, overlap = 50 } = options
  const maxChars = maxTokens * 4
  const overlapChars = overlap * 4

  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 20)
  const chunks: Omit<DocumentChunk, 'id' | 'document_id' | 'user_id' | 'created_at'>[] = []

  let currentChunk = ''
  let chunkIndex = 0

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChars && currentChunk.length > 0) {
      chunks.push({
        chunk_index: chunkIndex,
        content: currentChunk.trim(),
        token_count: estimateTokens(currentChunk),
        page_number: null,
        section_title: null,
        chunk_type: detectChunkType(currentChunk),
      })
      chunkIndex++
      currentChunk = currentChunk.slice(-overlapChars) + '\n\n' + paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  if (currentChunk.trim().length > 20) {
    chunks.push({
      chunk_index: chunkIndex,
      content: currentChunk.trim(),
      token_count: estimateTokens(currentChunk),
      page_number: null,
      section_title: null,
      chunk_type: detectChunkType(currentChunk),
    })
  }

  return chunks
}

function detectChunkType(text: string): 'text' | 'exercise' | 'definition' | 'theorem' | 'example' {
  if (/^(exerc[ií]cio|quest[aã]o|problema)\s*\d/im.test(text)) return 'exercise'
  if (/^(defini[çc][aã]o|def\.)\s/im.test(text)) return 'definition'
  if (/^(teorema|teo\.)\s/im.test(text)) return 'theorem'
  if (/^(exemplo|ex\.)\s*\d/im.test(text)) return 'example'
  const lower = text.toLowerCase()
  if (lower.includes('resolução') || lower.includes('solução')) return 'example'
  return 'text'
}
