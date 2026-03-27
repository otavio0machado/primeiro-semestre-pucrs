import { seedConceptGraphToRows } from '@/lib/materials/catalog'
import { getAllTopics } from '@/lib/services/disciplines'
import { supabase, type KgNode, type KgEdge, type Topic } from '../supabase'

export async function getKgNodes(): Promise<KgNode[]> {
  try {
    const { data, error } = await supabase
      .from('kg_nodes')
      .select('*')
      .order('id')
    if (error) throw error
    if (data && data.length > 0) return data
  } catch {
    // Falls back below.
  }

  return seedConceptGraphToRows().nodes.map(({ mastery, score, errorCount, ...node }) => node)
}

export async function getKgEdges(): Promise<KgEdge[]> {
  try {
    const { data, error } = await supabase
      .from('kg_edges')
      .select('*')
      .order('id')
    if (error) throw error
    if (data && data.length > 0) return data
  } catch {
    // Falls back below.
  }

  return seedConceptGraphToRows().edges
}

export async function getFullGraph(): Promise<{ nodes: KgNode[]; edges: KgEdge[] }> {
  const [nodes, edges] = await Promise.all([getKgNodes(), getKgEdges()])
  return { nodes, edges }
}

export interface GraphWithMastery {
  nodes: (KgNode & { mastery: Topic['mastery']; score: number; errorCount: number })[]
  edges: KgEdge[]
}

export async function getGraphWithMastery(): Promise<GraphWithMastery> {
  try {
    const [{ nodes, edges }, topics] = await Promise.all([
      getFullGraph(),
      supabase.from('topics').select('id, mastery, score, error_count').then(r => {
        if (r.error) throw r.error
        return r.data ?? []
      }),
    ])

    if (nodes.length > 0 && edges.length > 0) {
      const topicMap = new Map(topics.map(t => [t.id, t]))

      const enrichedNodes = nodes.map(node => {
        const topic = node.topic_id ? topicMap.get(node.topic_id) : null
        return {
          ...node,
          mastery: (topic?.mastery ?? 'none') as Topic['mastery'],
          score: topic?.score ?? 0,
          errorCount: topic?.error_count ?? 0,
        }
      })

      return { nodes: enrichedNodes, edges }
    }
  } catch {
    // Falls back below.
  }

  const topics = await getAllTopics()
  return seedConceptGraphToRows(topics)
}

export function filterGraph(
  graph: GraphWithMastery,
  filters: { discipline?: string; kind?: string; mastery?: string; search?: string }
): GraphWithMastery {
  let nodes = graph.nodes
  if (filters.discipline && filters.discipline !== 'all') {
    nodes = nodes.filter(n => n.discipline_id === filters.discipline)
  }
  if (filters.kind && filters.kind !== 'all') {
    nodes = nodes.filter(n => n.kind === filters.kind)
  }
  if (filters.mastery && filters.mastery !== 'all') {
    nodes = nodes.filter(n => n.mastery === filters.mastery)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    nodes = nodes.filter(n => n.label.toLowerCase().includes(q))
  }
  const nodeIds = new Set(nodes.map(n => n.id))
  const edges = graph.edges.filter(e => nodeIds.has(e.source_id) && nodeIds.has(e.target_id))
  return { nodes, edges }
}

export function getPrerequisites(
  nodeId: string,
  graph: GraphWithMastery
): GraphWithMastery['nodes'] {
  const prereqIds = graph.edges
    .filter(e => e.target_id === nodeId && e.kind === 'depends_on')
    .map(e => e.source_id)
  return graph.nodes.filter(n => prereqIds.includes(n.id))
}

export function getDependents(
  nodeId: string,
  graph: GraphWithMastery
): GraphWithMastery['nodes'] {
  const depIds = graph.edges
    .filter(e => e.source_id === nodeId && e.kind === 'depends_on')
    .map(e => e.target_id)
  return graph.nodes.filter(n => depIds.includes(n.id))
}

export function getWeaknesses(graph: GraphWithMastery) {
  return graph.nodes
    .filter(n => n.mastery === 'none' || n.mastery === 'exposed')
    .sort((a, b) => {
      const aBlockedCount = graph.edges.filter(e => e.source_id === a.id && e.kind === 'depends_on').length
      const bBlockedCount = graph.edges.filter(e => e.source_id === b.id && e.kind === 'depends_on').length
      return bBlockedCount - aBlockedCount
    })
}

export function getGraphStats(graph: GraphWithMastery) {
  const totalNodes = graph.nodes.length
  const concepts = graph.nodes.filter(n => n.kind === 'concept').length
  const formulas = graph.nodes.filter(n => n.kind === 'formula').length
  const theorems = graph.nodes.filter(n => n.kind === 'theorem').length
  const totalEdges = graph.edges.length
  const masteredCount = graph.nodes.filter(n => n.mastery === 'mastered' || n.mastery === 'proficient').length
  const avgMastery = totalNodes > 0 ? masteredCount / totalNodes : 0
  return { totalNodes, concepts, formulas, theorems, totalEdges, masteredCount, avgMastery }
}
