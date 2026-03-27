import {
  getCurriculumDiscipline,
  getCurriculumDisciplines,
  getCurriculumModule,
  getCurriculumModules,
  getCurriculumTopic,
  getCurriculumTopics,
  seedDisciplineToRow,
  seedModuleToRow,
  seedTopicToRow,
} from '@/lib/materials/catalog'
import { supabase, type Discipline, type Module, type Topic } from '../supabase'

function fallbackDisciplines(): Discipline[] {
  return getCurriculumDisciplines().map(seedDisciplineToRow)
}

function fallbackModules(disciplineId: string): Module[] {
  return getCurriculumModules(disciplineId).map(seedModuleToRow)
}

function fallbackTopics(disciplineId?: string): Topic[] {
  return getCurriculumTopics(disciplineId).map(seedTopicToRow)
}

export async function getDisciplines(): Promise<Discipline[]> {
  try {
    const { data, error } = await supabase
      .from('disciplines')
      .select('*')
      .order('name')
    if (error) throw error
    return data && data.length > 0 ? data : fallbackDisciplines()
  } catch {
    return fallbackDisciplines()
  }
}

export async function getDiscipline(id: string): Promise<Discipline | null> {
  try {
    const { data, error } = await supabase
      .from('disciplines')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  } catch {
    const seed = getCurriculumDiscipline(id)
    return seed ? seedDisciplineToRow(seed) : null
  }
}

export async function getModulesByDiscipline(disciplineId: string): Promise<Module[]> {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('discipline_id', disciplineId)
      .order('sort_order')
    if (error) throw error
    return data && data.length > 0 ? data : fallbackModules(disciplineId)
  } catch {
    return fallbackModules(disciplineId)
  }
}

export async function getTopicsByDiscipline(disciplineId: string): Promise<Topic[]> {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('discipline_id', disciplineId)
      .order('sort_order')
    if (error) throw error
    return data && data.length > 0 ? data : fallbackTopics(disciplineId)
  } catch {
    return fallbackTopics(disciplineId)
  }
}

export async function getTopicsByModule(moduleId: string): Promise<Topic[]> {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('module_id', moduleId)
      .order('sort_order')
    if (error) throw error
    if (data && data.length > 0) return data
  } catch {
    // Falls back to seed topics below.
  }

  const curriculumModule = getCurriculumModule(moduleId)
  if (!curriculumModule) return []

  return getCurriculumTopics(curriculumModule.disciplineId)
    .filter((topic) => topic.moduleId === moduleId)
    .map(seedTopicToRow)
}

export async function getAllTopics(): Promise<Topic[]> {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('discipline_id, sort_order')
    if (error) throw error
    return data && data.length > 0 ? data : fallbackTopics()
  } catch {
    return fallbackTopics()
  }
}

export async function getTopic(id: string): Promise<Topic | null> {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch {
    const seed = getCurriculumTopic(id)
    return seed ? seedTopicToRow(seed) : null
  }
}

export async function updateTopicMastery(
  topicId: string,
  mastery: Topic['mastery'],
  score: number
): Promise<void> {
  const { error } = await supabase
    .from('topics')
    .update({ mastery, score, updated_at: new Date().toISOString() })
    .eq('id', topicId)
  if (error) throw error
}

export async function incrementTopicExercises(
  topicId: string,
  attempted: number,
  available: number
): Promise<void> {
  const topic = await getTopic(topicId)
  if (!topic) return
  const { error } = await supabase
    .from('topics')
    .update({
      exercises_attempted: topic.exercises_attempted + attempted,
      exercises_available: Math.max(topic.exercises_available, available),
      updated_at: new Date().toISOString(),
    })
    .eq('id', topicId)
  if (error) throw error
}
