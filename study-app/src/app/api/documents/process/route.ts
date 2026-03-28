import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPdfText, chunkText, countWords } from '@/lib/documents/extract'
import { analyzeDocument } from '@/lib/documents/analyze'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/documents/process
 *
 * Two-phase processing optimized for Vercel Hobby (10s timeout):
 *
 * Phase 1 (fast, ~2-3s): Download → Extract text → Chunk → Save to DB
 *   - Returns immediately with extracted data
 *   - Document status: 'indexed' (text available for search)
 *
 * Phase 2 (optional, if body has `analyze: true`):
 *   - Calls Claude Haiku for classification and analysis
 *   - Takes ~3-5s extra
 *
 * Body: { documentId: string, analyze?: boolean }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { documentId, analyze = false } = await request.json()
    if (!documentId) {
      return NextResponse.json({ error: 'documentId é obrigatório' }, { status: 400 })
    }

    // Fetch document record
    const { data: doc, error: docError } = await supabase
      .from('user_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    // If already indexed and not requesting analysis, skip
    if (doc.processing_status === 'indexed' && !analyze) {
      return NextResponse.json({ ok: true, status: 'already_indexed' })
    }

    // If we only need analysis on an already-extracted document
    if (doc.processing_status === 'indexed' && analyze && doc.extracted_text) {
      return await runAnalysisOnly(supabase, doc, user.id)
    }

    // ═══ PHASE 1: Extract + Chunk (fast) ═══

    await supabase
      .from('user_documents')
      .update({ processing_status: 'extracting' })
      .eq('id', documentId)

    // Download file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      await supabase
        .from('user_documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId)
      return NextResponse.json({ error: 'Erro ao baixar arquivo' }, { status: 500 })
    }

    // Extract text
    let extractedText = ''
    let pageCount: number | null = null
    const buffer = Buffer.from(await fileData.arrayBuffer())

    if (doc.mime_type === 'application/pdf') {
      try {
        const result = await extractPdfText(buffer)
        extractedText = result.text
        pageCount = result.pageCount
      } catch (e) {
        console.error('PDF extraction error:', e)
        // Fallback: store empty text, mark as failed
        await supabase
          .from('user_documents')
          .update({ processing_status: 'failed' })
          .eq('id', documentId)
        return NextResponse.json({ ok: false, status: 'extraction_failed', error: String(e) })
      }
    } else if (doc.mime_type === 'text/html' || doc.mime_type === 'application/xhtml+xml' || doc.file_name?.endsWith('.html') || doc.file_name?.endsWith('.htm')) {
      // Strip HTML tags, keep text content
      const html = buffer.toString('utf-8')
      extractedText = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#\d+;/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    } else if (doc.mime_type.startsWith('image/')) {
      extractedText = '[Imagem — OCR pendente]'
    } else {
      extractedText = '[Formato não suportado]'
    }

    // Chunk the text (fast, CPU-only)
    const chunks = extractedText.length > 50 ? chunkText(extractedText) : []
    const wordCount = countWords(extractedText)

    // Save text + chunks in parallel
    const updateDocPromise = supabase
      .from('user_documents')
      .update({
        processing_status: 'indexed',
        extracted_text: extractedText,
        page_count: pageCount,
        word_count: wordCount,
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .then(() => {})

    if (chunks.length > 0) {
      const chunkRows = chunks.map((chunk) => ({
        document_id: documentId,
        user_id: user.id,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        token_count: chunk.token_count,
        page_number: chunk.page_number,
        section_title: chunk.section_title,
        chunk_type: chunk.chunk_type,
      }))

      await Promise.all([
        updateDocPromise,
        supabase.from('document_chunks').insert(chunkRows).then(() => {}),
      ])
    } else {
      await updateDocPromise
    }

    // ═══ PHASE 2: AI Analysis (optional) ═══

    let analysis = null
    if (analyze && extractedText.length > 50) {
      try {
        let disciplineName: string | undefined
        if (doc.discipline_id) {
          const { data: disc } = await supabase
            .from('disciplines')
            .select('name')
            .eq('id', doc.discipline_id)
            .single()
          disciplineName = disc?.name ?? undefined
        }

        analysis = await analyzeDocument(extractedText, {
          fileName: doc.file_name,
          disciplineName,
        })

        await supabase
          .from('user_documents')
          .update({
            ai_analysis: analysis,
            doc_type: analysis.doc_type || doc.doc_type,
            doc_type_confidence: analysis.confidence || null,
          })
          .eq('id', documentId)
      } catch (e) {
        console.error('Analysis error (non-fatal):', e)
      }
    }

    return NextResponse.json({
      ok: true,
      status: 'indexed',
      analysis,
      chunks: chunks.length,
      pageCount,
      wordCount,
    })
  } catch (error) {
    console.error('Document process error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Run AI analysis on an already-extracted document.
 */
async function runAnalysisOnly(
  supabase: Awaited<ReturnType<typeof createClient>>,
  doc: Record<string, unknown>,
  userId: string,
) {
  try {
    let disciplineName: string | undefined
    if (doc.discipline_id) {
      const { data: disc } = await supabase
        .from('disciplines')
        .select('name')
        .eq('id', doc.discipline_id as string)
        .single()
      disciplineName = disc?.name ?? undefined
    }

    const analysis = await analyzeDocument(doc.extracted_text as string, {
      fileName: doc.file_name as string,
      disciplineName,
    })

    await supabase
      .from('user_documents')
      .update({
        ai_analysis: analysis,
        doc_type: analysis.doc_type || (doc.doc_type as string),
        doc_type_confidence: analysis.confidence || null,
      })
      .eq('id', doc.id as string)

    return NextResponse.json({ ok: true, status: 'analyzed', analysis })
  } catch (e) {
    console.error('Analysis-only error:', e)
    return NextResponse.json({ ok: true, status: 'analysis_failed', error: String(e) })
  }
}
