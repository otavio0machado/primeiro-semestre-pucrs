import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCurriculum, generateInitialFlashcards } from '@/lib/documents/analyze'
import type { BootstrapInput } from '@/lib/documents/types'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/onboarding/bootstrap
 *
 * The intelligent bootstrap: reads user profile + processed documents,
 * generates curriculum via Claude, and populates the database.
 *
 * Returns the generated curriculum for review.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // 1. Load user profile (create if missing — handles edge cases from OAuth)
    let { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
          university: '',
          course: '',
          total_semesters: 0,
          current_semester: 1,
          onboarding_completed: false,
          onboarding_step: 'bootstrap',
        })
        .select()
        .single()

      if (insertError || !newProfile) {
        console.error('Profile creation error:', insertError)
        return NextResponse.json({ error: 'Não foi possível criar perfil' }, { status: 500 })
      }
      profile = newProfile
    }

    // 2. Load all processed documents
    const { data: documents } = await supabase
      .from('user_documents')
      .select('id, file_name, doc_type, discipline_id, ai_analysis, extracted_text')
      .eq('user_id', user.id)
      .in('processing_status', ['indexed', 'analyzing'])

    // 3. Check if we already have disciplines (legacy data claimed)
    const { data: existingDisciplines } = await supabase
      .from('disciplines')
      .select('id')
      .eq('user_id', user.id)

    const hasLegacyData = (existingDisciplines?.length ?? 0) > 0

    // 4. Build bootstrap input
    const bootstrapInput: BootstrapInput = {
      userId: user.id,
      university: profile.university || 'Universidade',
      course: profile.course || 'Curso',
      currentSemester: profile.current_semester || 1,
      totalSemesters: profile.total_semesters || 8,
      enrollmentYear: profile.enrollment_year || '2026/1',
      documents: (documents || []).map((d) => ({
        id: d.id,
        fileName: d.file_name,
        docType: d.doc_type,
        disciplineId: d.discipline_id,
        analysis: d.ai_analysis,
        extractedText: d.extracted_text?.slice(0, 3000) || null, // limit for context
      })),
    }

    // 5. Generate curriculum via Claude
    const curriculum = await generateCurriculum(bootstrapInput)

    // 6. If we have legacy data, don't create new disciplines — just return what was generated
    if (hasLegacyData) {
      // Claim any unclaimed legacy data
      await fetch(new URL('/api/admin/claim-legacy-data', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').toString(), {
        method: 'POST',
        headers: { cookie: '' }, // Server-side call, auth handled by supabase
      }).catch(() => {})

      return NextResponse.json({
        ok: true,
        hasLegacyData: true,
        curriculum,
        message: 'Dados existentes preservados. Currículo gerado para referência.',
      })
    }

    // 7. Populate database with generated curriculum
    let totalFlashcards = 0
    let totalKgNodes = 0
    let totalKgEdges = 0

    for (const disc of curriculum.disciplines) {
      // Create discipline
      const discId = disc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')

      const { error: discError } = await supabase.from('disciplines').insert({
        id: discId,
        user_id: user.id,
        code: discId.toUpperCase().slice(0, 10),
        name: disc.name,
        professor: disc.professor || 'A definir',
        schedule: '',
        grading_formula: '',
        approval_score: 6.0,
        credits: 4,
      })

      if (discError) {
        console.error('Discipline insert error:', discError)
        continue
      }

      // Create modules and topics
      const allTopics: Array<{ name: string; difficulty: number; moduleId: string }> = []

      for (const mod of disc.modules) {
        const moduleId = `${discId}-mod-${mod.order}`

        await supabase.from('modules').insert({
          id: moduleId,
          user_id: user.id,
          discipline_id: discId,
          name: mod.name,
          order_index: mod.order,
        })

        for (let i = 0; i < mod.topics.length; i++) {
          const topic = mod.topics[i]
          const topicId = `${moduleId}-t-${i + 1}`

          await supabase.from('topics').insert({
            id: topicId,
            user_id: user.id,
            module_id: moduleId,
            name: topic.name,
            mastery_level: 'none',
            score: null,
            order_index: i + 1,
          })

          allTopics.push({ name: topic.name, difficulty: topic.difficulty, moduleId })

          // Create KG node
          await supabase.from('kg_nodes').insert({
            id: topicId,
            user_id: user.id,
            label: topic.name,
            kind: 'concept',
            discipline_id: discId,
            metadata: { difficulty: topic.difficulty },
          })
          totalKgNodes++

          // Create prerequisite edges
          for (const prereqName of topic.prerequisites || []) {
            const prereqTopic = allTopics.find(
              (t) => t.name.toLowerCase() === prereqName.toLowerCase()
            )
            if (prereqTopic) {
              const prereqId = `${prereqTopic.moduleId}-t-${allTopics.indexOf(prereqTopic) + 1}`
              await supabase.from('kg_edges').insert({
                user_id: user.id,
                source_id: prereqId.includes('-t-') ? prereqId : topicId,
                target_id: topicId,
                kind: 'depends_on',
                weight: 1.0,
              })
              totalKgEdges++
            }
          }
        }
      }

      // Create assessments
      for (const assessment of disc.assessments || []) {
        const assessmentId = `${discId}-${assessment.name.toLowerCase().replace(/\s+/g, '-')}`

        await supabase.from('assessments').insert({
          id: assessmentId,
          user_id: user.id,
          discipline_id: discId,
          name: assessment.name,
          type: assessment.type === 'trabalho' ? 'trabalho' : 'prova',
          date: assessment.date || null,
          weight: assessment.weight || null,
          status: 'upcoming',
          is_cumulative: false,
        })
      }

      // Generate flashcards for this discipline
      try {
        const flashcards = await generateInitialFlashcards(
          disc.name,
          allTopics.slice(0, 10).map((t) => ({ name: t.name, difficulty: t.difficulty }))
        )

        for (const fc of flashcards) {
          const matchingTopic = allTopics.find(
            (t) => t.name.toLowerCase() === fc.topic.toLowerCase()
          )
          const topicId = matchingTopic
            ? `${matchingTopic.moduleId}-t-${allTopics.indexOf(matchingTopic) + 1}`
            : null

          await supabase.from('flashcards').insert({
            user_id: user.id,
            topic_id: topicId,
            front: fc.front,
            back: fc.back,
            type: fc.type || 'definition',
            box: 0,
            next_review: new Date().toISOString(),
            times_reviewed: 0,
            times_correct: 0,
          })
          totalFlashcards++
        }
      } catch (e) {
        console.error('Flashcard generation error for', disc.name, e)
      }
    }

    // Update counts
    curriculum.flashcardsGenerated = totalFlashcards
    curriculum.kgNodesCreated = totalKgNodes
    curriculum.kgEdgesCreated = totalKgEdges

    return NextResponse.json({
      ok: true,
      hasLegacyData: false,
      curriculum,
      stats: {
        disciplines: curriculum.disciplines.length,
        flashcards: totalFlashcards,
        kgNodes: totalKgNodes,
        kgEdges: totalKgEdges,
      },
    })
  } catch (error) {
    console.error('Bootstrap error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
