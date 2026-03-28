import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * POST /api/documents/upload
 *
 * Uploads a file to Supabase Storage and creates a user_documents record.
 * Processing happens separately via /api/documents/process.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const disciplineId = formData.get('disciplineId') as string | null
    const source = (formData.get('source') as string) || 'materiais_page'

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Arquivo excede 50MB' }, { status: 413 })
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/html',
      'application/xhtml+xml',
      'image/png',
      'image/jpeg',
    ]

    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['pdf', 'docx', 'pptx', 'html', 'htm', 'png', 'jpg', 'jpeg']
    const isAllowed = allowedTypes.includes(file.type) || (ext && allowedExtensions.includes(ext))

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Tipo não suportado. Use PDF, DOCX, PPTX, HTML, PNG ou JPG.' },
        { status: 400 }
      )
    }

    // Build storage path: {user_id}/{source}/{timestamp}_{filename}
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.id}/${source}/${timestamp}_${safeName}`
    const isHtml = ext === 'html' || ext === 'htm'

    const buffer = Buffer.from(await file.arrayBuffer())

    // HTML files: skip Storage (Supabase blocks text/html), extract text and save directly
    if (isHtml) {
      const htmlContent = buffer.toString('utf-8')
      const extractedText = htmlContent
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

      const { data: doc, error: dbError } = await supabase
        .from('user_documents')
        .insert({
          user_id: user.id,
          discipline_id: disciplineId || null,
          file_name: file.name,
          file_path: `inline:${storagePath}`,
          file_size: file.size,
          mime_type: 'text/html',
          doc_type: 'other',
          processing_status: 'indexed',
          extracted_text: extractedText,
          word_count: extractedText.split(/\s+/).filter(Boolean).length,
          processed_at: new Date().toISOString(),
          source,
        })
        .select('id, file_name, processing_status')
        .single()

      if (dbError) {
        console.error('DB insert error (HTML):', dbError)
        return NextResponse.json({ error: 'Erro ao registrar documento' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, document: doc })
    }

    // Non-HTML: upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      )
    }

    // Create database record
    const { data: doc, error: dbError } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        discipline_id: disciplineId || null,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        doc_type: 'other',
        processing_status: 'pending',
        source,
      })
      .select('id, file_name, processing_status')
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      await supabase.storage.from('user-documents').remove([storagePath])
      return NextResponse.json(
        { error: 'Erro ao registrar documento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, document: doc })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
