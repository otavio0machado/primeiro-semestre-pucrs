import disciplineSeeds from "@/data/materials/disciplines.json";
import moduleSeeds from "@/data/materials/modules.json";
import topicSeeds from "@/data/materials/topics.json";
import assessmentSeeds from "@/data/materials/assessments.json";
import documentSeeds from "@/data/materials/documents-index.json";
import conceptGraphSeed from "@/data/materials/concept-graph.json";
import type {
  DocumentExtract,
  MaterialDocument,
  SeedAssessment,
  SeedConceptGraph,
  SeedDiscipline,
  SeedModule,
  SeedTopic,
} from "@/lib/materials/types";
import type { Assessment, Discipline, KgEdge, KgNode, Module, Topic } from "@/lib/supabase";

const disciplines = disciplineSeeds as SeedDiscipline[];
const modules = moduleSeeds as SeedModule[];
const topics = topicSeeds as SeedTopic[];
const assessments = assessmentSeeds as SeedAssessment[];
const documents = (documentSeeds as MaterialDocument[]).map((document) => ({
  ...document,
  source: "seed" as const,
  storagePath: null,
  uploadedAt: null,
}));
const conceptGraph = conceptGraphSeed as SeedConceptGraph;

const disciplineColors: Record<string, string> = {
  "calculo-1": "#3b82f6",
  "mat-discreta": "#10b981",
};

export function getCurriculumDisciplines(): SeedDiscipline[] {
  return disciplines;
}

export function getCurriculumDiscipline(id: string): SeedDiscipline | null {
  return disciplines.find((discipline) => discipline.id === id) ?? null;
}

export function getCurriculumModules(disciplineId?: string): SeedModule[] {
  return modules
    .filter((module) => !disciplineId || module.disciplineId === disciplineId)
    .sort((left, right) => left.order - right.order);
}

export function getCurriculumModule(id: string): SeedModule | null {
  return modules.find((module) => module.id === id) ?? null;
}

export function getCurriculumTopics(disciplineId?: string): SeedTopic[] {
  const allowedModuleIds = new Set(
    getCurriculumModules(disciplineId).map((module) => module.id),
  );

  return topics
    .filter((topic) => !disciplineId || allowedModuleIds.has(topic.moduleId))
    .sort((left, right) => left.order - right.order);
}

export function getCurriculumTopic(id: string): SeedTopic | null {
  return topics.find((topic) => topic.id === id) ?? null;
}

export function getCurriculumAssessments(disciplineId?: string): SeedAssessment[] {
  return assessments
    .filter((assessment) => !disciplineId || assessment.disciplineId === disciplineId)
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function getCurriculumAssessment(id: string): SeedAssessment | null {
  return assessments.find((assessment) => assessment.id === id) ?? null;
}

export function getCurriculumDocuments(disciplineId?: string): MaterialDocument[] {
  return documents
    .filter((document) => !disciplineId || document.disciplineId === disciplineId)
    .sort((left, right) => left.filename.localeCompare(right.filename));
}

export function getCurriculumDocument(id: string): MaterialDocument | null {
  return documents.find((document) => document.id === id) ?? null;
}

export function getDocumentsForTopic(topicId: string): MaterialDocument[] {
  return documents.filter((document) => document.topicIds.includes(topicId));
}

export function getExerciseSourceDocuments(disciplineId?: string): MaterialDocument[] {
  return getCurriculumDocuments(disciplineId).filter((document) => document.hasExercises);
}

export function getCurriculumConceptGraph(): SeedConceptGraph {
  return conceptGraph;
}

export function seedDisciplineToRow(seed: SeedDiscipline): Discipline {
  return {
    id: seed.id,
    code: seed.code,
    name: seed.name,
    professor: seed.professor,
    schedule: seed.schedule,
    grading_formula: seed.gradingFormula,
    approval_criteria: seed.approvalCriteria,
    color: disciplineColors[seed.id] ?? "#64748b",
    created_at: `${seed.semester}-01T00:00:00.000Z`,
  };
}

export function seedModuleToRow(seed: SeedModule): Module {
  return {
    id: seed.id,
    discipline_id: seed.disciplineId,
    name: seed.name,
    sort_order: seed.order,
    created_at: `${seed.startDate}T00:00:00.000Z`,
  };
}

export function seedTopicToRow(seed: SeedTopic): Topic {
  const curriculumModule = getCurriculumModule(seed.moduleId);
  return {
    id: seed.id,
    module_id: seed.moduleId,
    discipline_id: curriculumModule?.disciplineId ?? "",
    name: seed.name,
    description: seed.subtopics.map((subtopic) => subtopic.name).join(" · ") || null,
    mastery: "none",
    score: 0,
    exercises_attempted: 0,
    exercises_available: seed.microcompetencies.length,
    error_count: 0,
    sort_order: seed.order,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

export function seedAssessmentToRow(seed: SeedAssessment): Assessment {
  return {
    id: seed.id,
    discipline_id: seed.disciplineId,
    type: seed.type,
    name: seed.name,
    date: seed.date,
    weight: seed.weight,
    is_cumulative: seed.isCumulative,
    status: seed.status,
    score: seed.score,
    created_at: `${seed.date}T00:00:00.000Z`,
  };
}

export function seedConceptGraphToRows(
  topicProgress: Pick<Topic, "id" | "mastery" | "score" | "error_count">[] = [],
): { nodes: (KgNode & { mastery: Topic["mastery"]; score: number; errorCount: number })[]; edges: KgEdge[] } {
  const progressMap = new Map(topicProgress.map((topic) => [topic.id, topic]));
  const topicIndexByDiscipline = new Map<string, number>();

  const nodes = conceptGraph.nodes.map((node) => {
    const topic = progressMap.get(node.topicId);
    const positionIndex = topicIndexByDiscipline.get(node.disciplineId) ?? 0;
    topicIndexByDiscipline.set(node.disciplineId, positionIndex + 1);

    return {
      id: node.id,
      topic_id: node.topicId,
      label: node.label,
      kind: "concept" as const,
      discipline_id: node.disciplineId,
      module_id: getCurriculumTopic(node.topicId)?.moduleId ?? "",
      description: node.description,
      latex: null,
      x: 220 + positionIndex * 90,
      y: node.disciplineId === "calculo-1" ? 140 : 340,
      created_at: "2026-01-01T00:00:00.000Z",
      mastery: (topic?.mastery ?? "none") as Topic["mastery"],
      score: topic?.score ?? 0,
      errorCount: topic?.error_count ?? 0,
    };
  });

  const edges = conceptGraph.edges.map((edge, index) => {
    const kind: KgEdge["kind"] = edge.relation === "prerequisite" ? "depends_on" : "connects";

    return {
      id: `seed-edge-${index + 1}`,
      source_id: edge.source,
      target_id: edge.target,
      kind,
      label: edge.description,
      weight: edge.weight,
      created_at: "2026-01-01T00:00:00.000Z",
    };
  });

  return { nodes, edges };
}

export function buildDisciplineNameMap(): Record<string, string> {
  return Object.fromEntries(
    disciplines.map((discipline) => [discipline.id, discipline.name]),
  );
}

export function getDocumentTopicNames(document: MaterialDocument): string[] {
  return document.topicIds
    .map((topicId) => getCurriculumTopic(topicId)?.name)
    .filter((topicName): topicName is string => Boolean(topicName));
}

export function groupDocumentsByDiscipline(): Array<{
  discipline: SeedDiscipline;
  documents: MaterialDocument[];
}> {
  return disciplines.map((discipline) => ({
    discipline,
    documents: getCurriculumDocuments(discipline.id),
  }));
}

export function documentExtractToMap(
  extracts: DocumentExtract[],
): Map<string, DocumentExtract> {
  return new Map(extracts.map((extract) => [extract.id, extract]));
}
