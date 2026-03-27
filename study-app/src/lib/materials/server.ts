import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import extractsJson from "@/data/materials/document-extracts.json";
import {
  documentExtractToMap,
  getCurriculumDiscipline,
  getCurriculumDisciplines,
  getCurriculumDocument,
  getCurriculumDocuments,
  getCurriculumTopic,
  getDocumentTopicNames,
} from "@/lib/materials/catalog";
import { readCustomMaterialDocuments } from "@/lib/materials/custom";
import type { DocumentExtract, MaterialDocument } from "@/lib/materials/types";

const extractMap = documentExtractToMap(extractsJson as DocumentExtract[]);

const ALLOWED_ROOTS = [
  path.resolve(process.cwd()),
  path.resolve(process.cwd(), "Documentos"),
  path.resolve(process.cwd(), "..", "Documentos"),
];

async function resolveDocumentPath(relativeOrFilename?: string | null): Promise<string | null> {
  if (!relativeOrFilename) {
    return null;
  }

  const candidates = [
    path.resolve(process.cwd(), relativeOrFilename),
    path.resolve(process.cwd(), "Documentos", relativeOrFilename),
    path.resolve(process.cwd(), "..", "Documentos", relativeOrFilename),
  ];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const root = ALLOWED_ROOTS[i];

    if (!candidate.startsWith(root + path.sep) && candidate !== root) {
      continue;
    }

    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

function sortMaterialDocuments(left: MaterialDocument, right: MaterialDocument): number {
  if (left.source !== right.source) {
    return left.source === "custom" ? -1 : 1;
  }

  if (left.source === "custom" && right.source === "custom") {
    return (right.uploadedAt ?? "").localeCompare(left.uploadedAt ?? "");
  }

  return left.filename.localeCompare(right.filename, "pt-BR");
}

async function resolveMaterialFilePath(document: MaterialDocument): Promise<string | null> {
  return (await resolveDocumentPath(document.storagePath)) ?? (await resolveDocumentPath(document.filename));
}

export function getMaterialExtract(documentId: string): DocumentExtract | null {
  return extractMap.get(documentId) ?? null;
}

export async function listCustomMaterialDocuments(disciplineId?: string): Promise<MaterialDocument[]> {
  noStore();

  const documents = await readCustomMaterialDocuments();
  return documents
    .filter((document) => !disciplineId || document.disciplineId === disciplineId)
    .sort(sortMaterialDocuments);
}

export async function listMaterialDocuments(disciplineId?: string): Promise<MaterialDocument[]> {
  noStore();

  const seedDocuments = getCurriculumDocuments(disciplineId);
  const customDocuments = await listCustomMaterialDocuments(disciplineId);

  return [...seedDocuments, ...customDocuments].sort(sortMaterialDocuments);
}

export async function listExerciseSourceDocuments(
  disciplineId?: string,
): Promise<MaterialDocument[]> {
  const documents = await listMaterialDocuments(disciplineId);
  return documents.filter((document) => document.hasExercises);
}

export async function groupMaterialDocumentsByDiscipline(): Promise<
  Array<{
    discipline: ReturnType<typeof getCurriculumDisciplines>[number];
    documents: MaterialDocument[];
  }>
> {
  const allDocuments = await listMaterialDocuments();

  return getCurriculumDisciplines().map((discipline) => ({
    discipline,
    documents: allDocuments
      .filter((document) => document.disciplineId === discipline.id)
      .sort(sortMaterialDocuments),
  }));
}

export async function getMaterialDocument(documentId: string): Promise<MaterialDocument | null> {
  noStore();

  const seedDocument = getCurriculumDocument(documentId);
  if (seedDocument) {
    return seedDocument;
  }

  const customDocuments = await readCustomMaterialDocuments();
  return customDocuments.find((document) => document.id === documentId) ?? null;
}

export async function getMaterialFileAsset(documentId: string): Promise<{
  document: MaterialDocument;
  filePath: string;
} | null> {
  const document = await getMaterialDocument(documentId);
  if (!document) {
    return null;
  }

  const filePath = await resolveMaterialFilePath(document);
  if (!filePath) {
    return null;
  }

  return { document, filePath };
}

export async function buildMaterialSourceContent(documentId: string): Promise<{
  documentId: string;
  disciplineName: string;
  topicNames: string[];
  content: string;
  fileAvailable: boolean;
  filename: string;
}> {
  const document = await getMaterialDocument(documentId);
  if (!document) {
    throw new Error("Documento não encontrado");
  }

  const discipline = getCurriculumDiscipline(document.disciplineId);
  const extract = getMaterialExtract(documentId);
  const topicNames = getDocumentTopicNames(document);
  const fileAvailable = Boolean(await resolveMaterialFilePath(document));
  const preview = extract?.preview?.trim();

  const content = [
    `Documento: ${document.filename}`,
    `Disciplina: ${discipline?.name ?? document.disciplineId}`,
    `Origem: ${document.source === "custom" ? "adicionado manualmente na plataforma" : "catálogo oficial"}`,
    `Tipo: ${document.type}`,
    `Relevância: ${document.relevance}`,
    `Tópicos cobertos: ${topicNames.join(", ") || "geral da disciplina"}`,
    `Descrição: ${document.description}`,
    `Uso pedagógico planejado: ${document.usage}`,
    preview ? `Conteúdo extraído:\n${preview}` : "Conteúdo extraído indisponível.",
  ].join("\n\n");

  return {
    documentId: document.id,
    disciplineName: discipline?.name ?? document.disciplineId,
    topicNames,
    content,
    fileAvailable,
    filename: document.filename,
  };
}

export async function getMaterialDocumentView(documentId: string) {
  const document = await getMaterialDocument(documentId);
  if (!document) {
    return null;
  }

  const discipline = getCurriculumDiscipline(document.disciplineId);
  const topicDetails = document.topicIds
    .map((topicId) => {
      const topic = getCurriculumTopic(topicId);
      return topic
        ? {
            id: topic.id,
            name: topic.name,
            moduleId: topic.moduleId,
          }
        : null;
    })
    .filter((topic): topic is { id: string; name: string; moduleId: string } => Boolean(topic));

  return {
    ...document,
    disciplineName: discipline?.name ?? document.disciplineId,
    topicNames: topicDetails.map((topic) => topic.name),
    topicDetails,
    extract: getMaterialExtract(document.id),
    fileAvailable: Boolean(await resolveMaterialFilePath(document)),
    fileUrl: `/api/materials/file/${document.id}`,
  };
}
