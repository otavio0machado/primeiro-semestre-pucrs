import type { SeedDocument } from "@/lib/materials/types";

export function getMaterialTags(document: SeedDocument): string[] {
  return [
    "fonte-oficial",
    `material:${document.id}`,
    `tipo:${document.type}`,
  ];
}

export function prependMaterialHeader(content: string, document: SeedDocument): string {
  return [
    `Fonte oficial: ${document.filename}`,
    `Documento: ${document.id}`,
    `Tipo: ${document.type}`,
    "",
    content,
  ].join("\n");
}
