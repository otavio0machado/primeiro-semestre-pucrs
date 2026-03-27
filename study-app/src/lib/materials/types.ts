export type MaterialDocumentType =
  | "plano_ensino"
  | "material_aula"
  | "lista_exercicios"
  | "exemplos_resolvidos"
  | "livro_texto";

export type MaterialRelevance = "critical" | "high" | "medium" | "low";

export interface SeedDiscipline {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  schedule: string;
  professor: string;
  professorEmail: string;
  totalHours: number;
  ementa: string;
  gradingFormula: string;
  approvalCriteria: string;
}

export interface SeedModule {
  id: string;
  disciplineId: string;
  name: string;
  order: number;
  description: string;
  assessmentIds: string[];
  startDate: string;
  endDate: string;
}

export interface SeedSubtopic {
  id: string;
  topicId: string;
  name: string;
  order: number;
  description: string;
}

export interface SeedMicrocompetency {
  id: string;
  topicId: string;
  description: string;
  bloomLevel: number;
  currentMastery: string;
  lastAssessedAt: string | null;
}

export interface SeedTopic {
  id: string;
  moduleId: string;
  name: string;
  order: number;
  classNumbers: number[];
  documentRefs: string[];
  subtopics: SeedSubtopic[];
  microcompetencies: SeedMicrocompetency[];
}

export interface SeedAssessment {
  id: string;
  disciplineId: string;
  type: "prova" | "trabalho" | "ps" | "g2";
  name: string;
  date: string;
  classNumber: number | null;
  weight: number;
  content: string[];
  topicIds: string[];
  isCumulative: boolean;
  status: "upcoming" | "ready" | "completed";
  score: number | null;
}

export interface SeedDocument {
  id: string;
  filename: string;
  type: MaterialDocumentType;
  disciplineId: string;
  topicIds: string[];
  description: string;
  relevance: MaterialRelevance;
  usage: string;
  hasExercises: boolean;
  hasSolutions: boolean;
  pageCount: number;
}

export interface SeedConceptNode {
  id: string;
  label: string;
  disciplineId: string;
  topicId: string;
  description: string;
  mastery: string;
}

export interface SeedConceptEdge {
  source: string;
  target: string;
  relation: string;
  weight: number;
  description: string;
}

export interface SeedConceptGraph {
  nodes: SeedConceptNode[];
  edges: SeedConceptEdge[];
}

export interface DocumentExtract {
  id: string;
  preview: string;
  extractedChars: number;
  truncated: boolean;
}
