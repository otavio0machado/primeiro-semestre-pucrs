import "server-only";

import fs from "node:fs";
import path from "node:path";
import extractsJson from "@/data/materials/document-extracts.json";
import {
  documentExtractToMap,
  getCurriculumDiscipline,
  getCurriculumDocument,
  getCurriculumTopic,
  getDocumentTopicNames,
} from "@/lib/materials/catalog";
import type { DocumentExtract } from "@/lib/materials/types";

const extractMap = documentExtractToMap(extractsJson as DocumentExtract[]);

function resolveDocumentPath(filename: string): string | null {
  const candidates = [
    path.resolve(process.cwd(), "Documentos", filename),
    path.resolve(process.cwd(), "..", "Documentos", filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function getMaterialExtract(documentId: string): DocumentExtract | null {
  return extractMap.get(documentId) ?? null;
}

export function buildMaterialSourceContent(documentId: string): {
  documentId: string;
  disciplineName: string;
  topicNames: string[];
  content: string;
  fileAvailable: boolean;
  filename: string;
} {
  const document = getCurriculumDocument(documentId);
  if (!document) {
    throw new Error("Documento não encontrado");
  }

  const discipline = getCurriculumDiscipline(document.disciplineId);
  const extract = getMaterialExtract(documentId);
  const topicNames = getDocumentTopicNames(document);
  const fileAvailable = Boolean(resolveDocumentPath(document.filename));
  const preview = extract?.preview?.trim();

  const content = [
    `Documento: ${document.filename}`,
    `Disciplina: ${discipline?.name ?? document.disciplineId}`,
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

export function getMaterialDocumentView(documentId: string) {
  const document = getCurriculumDocument(documentId);
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
    fileAvailable: Boolean(resolveDocumentPath(document.filename)),
  };
}
