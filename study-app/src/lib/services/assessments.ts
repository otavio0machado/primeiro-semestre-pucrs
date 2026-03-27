import {
  getCurriculumAssessment,
  getCurriculumAssessments,
  seedAssessmentToRow,
} from '@/lib/materials/catalog'
import { supabase, type Assessment, type AssessmentStatus } from '../supabase'

function fallbackAssessments(disciplineId?: string): Assessment[] {
  return getCurriculumAssessments(disciplineId).map(seedAssessmentToRow)
}

export async function getAssessments(): Promise<Assessment[]> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .order('date')
    if (error) throw error
    return data && data.length > 0 ? data : fallbackAssessments()
  } catch {
    return fallbackAssessments()
  }
}

export async function getAssessmentsByDiscipline(disciplineId: string): Promise<Assessment[]> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('discipline_id', disciplineId)
      .order('date')
    if (error) throw error
    return data && data.length > 0 ? data : fallbackAssessments(disciplineId)
  } catch {
    return fallbackAssessments(disciplineId)
  }
}

export async function getUpcomingAssessments(): Promise<Assessment[]> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .in('status', ['upcoming', 'ready'])
      .order('date')
    if (error) throw error
    return data && data.length > 0
      ? data
      : fallbackAssessments().filter((assessment) => assessment.status !== 'completed')
  } catch {
    return fallbackAssessments().filter((assessment) => assessment.status !== 'completed')
  }
}

export async function getNextExam(): Promise<Assessment | null> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('type', 'prova')
    .gte('date', today)
    .order('date')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateAssessmentScore(
  id: string,
  score: number
): Promise<void> {
  const { error } = await supabase
    .from('assessments')
    .update({ score, status: 'completed' as AssessmentStatus })
    .eq('id', id)
  if (error) throw error
}

export async function updateAssessmentStatus(
  id: string,
  status: AssessmentStatus
): Promise<void> {
  const { error } = await supabase
    .from('assessments')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function getAssessmentTopicIds(assessmentId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('assessment_topics')
      .select('topic_id')
      .eq('assessment_id', assessmentId)
    if (error) throw error
    return data && data.length > 0
      ? data.map(r => r.topic_id)
      : (getCurriculumAssessment(assessmentId)?.topicIds ?? [])
  } catch {
    return getCurriculumAssessment(assessmentId)?.topicIds ?? []
  }
}

export async function getAssessmentWithTopics(assessmentId: string) {
  const [assessment, topicIds] = await Promise.all([
    supabase.from('assessments').select('*').eq('id', assessmentId).single(),
    getAssessmentTopicIds(assessmentId),
  ])
  if (assessment.error) throw assessment.error
  return { ...assessment.data, topicIds }
}
