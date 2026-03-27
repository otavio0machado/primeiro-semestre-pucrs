import "server-only";

import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type {
  MaterialDocument,
  MaterialDocumentType,
  MaterialRelevance,
} from "@/lib/materials/types";

const execFileAsync = promisify(execFile);

const CUSTOM_CATALOG_PATH = path.resolve(
  process.cwd(),
  "local-data/materials/custom-documents.json",
);
const CUSTOM_UPLOAD_DIRECTORY = "_custom";
const MATERIALS_DIRECTORY_CANDIDATES = [
  path.resolve(process.cwd(), "Documentos"),
  path.resolve(process.cwd(), "..", "Documentos"),
];

interface StoredCustomMaterialRecord extends MaterialDocument {
  source: "custom";
  storagePath: string;
  uploadedAt: string;
}

export interface CreateCustomMaterialInput {
  description: string;
  disciplineId: string;
  filename: string;
  fileBuffer: Buffer;
  hasExercises: boolean;
  hasSolutions: boolean;
  pageCount?: number | null;
  relevance: MaterialRelevance;
  topicIds: string[];
  type: MaterialDocumentType;
  usage: string;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureCustomCatalogFile(): Promise<void> {
  await fs.mkdir(path.dirname(CUSTOM_CATALOG_PATH), { recursive: true });

  if (!(await pathExists(CUSTOM_CATALOG_PATH))) {
    await fs.writeFile(CUSTOM_CATALOG_PATH, "[]\n", "utf8");
  }
}

async function writeCustomMaterialDocuments(documents: StoredCustomMaterialRecord[]): Promise<void> {
  await ensureCustomCatalogFile();
  const tmpPath = `${CUSTOM_CATALOG_PATH}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(documents, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, CUSTOM_CATALOG_PATH);
}

function sanitizeFilename(filename: string): string {
  const extension = path.extname(filename) || ".pdf";
  const basename = path.basename(filename, extension);
  const normalized = basename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${normalized || "material"}${extension.toLowerCase()}`;
}

async function getWritableMaterialsDirectory(): Promise<string> {
  for (const candidate of MATERIALS_DIRECTORY_CANDIDATES) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  const fallbackDirectory = MATERIALS_DIRECTORY_CANDIDATES.at(-1) ?? MATERIALS_DIRECTORY_CANDIDATES[0];
  await fs.mkdir(fallbackDirectory, { recursive: true });
  return fallbackDirectory;
}

async function inferPdfPageCount(filePath: string): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync("/usr/bin/mdls", [
      "-name",
      "kMDItemNumberOfPages",
      "-raw",
      filePath,
    ]);
    const pageCount = Number.parseInt(stdout.trim(), 10);

    return Number.isFinite(pageCount) && pageCount > 0 ? pageCount : null;
  } catch {
    return null;
  }
}

function sortCustomDocuments(
  left: StoredCustomMaterialRecord,
  right: StoredCustomMaterialRecord,
): number {
  return right.uploadedAt.localeCompare(left.uploadedAt);
}

export async function readCustomMaterialDocuments(): Promise<StoredCustomMaterialRecord[]> {
  await ensureCustomCatalogFile();

  const raw = await fs.readFile(CUSTOM_CATALOG_PATH, "utf8");
  const parsed = JSON.parse(raw) as StoredCustomMaterialRecord[];

  return parsed
    .filter((document) => document.source === "custom" && Boolean(document.storagePath))
    .sort(sortCustomDocuments);
}

export async function createCustomMaterialDocument(
  input: CreateCustomMaterialInput,
): Promise<StoredCustomMaterialRecord> {
  const materialsDirectory = await getWritableMaterialsDirectory();
  const uploadDirectory = path.join(materialsDirectory, CUSTOM_UPLOAD_DIRECTORY);
  await fs.mkdir(uploadDirectory, { recursive: true });

  const uploadedAt = new Date().toISOString();
  const safeFilename = sanitizeFilename(input.filename);
  const storedFilename = `${Date.now()}-${safeFilename}`;
  const storedRelativePath = path.posix.join(CUSTOM_UPLOAD_DIRECTORY, storedFilename);
  const storedAbsolutePath = path.join(uploadDirectory, storedFilename);

  await fs.writeFile(storedAbsolutePath, input.fileBuffer);

  const inferredPageCount =
    input.pageCount && input.pageCount > 0 ? input.pageCount : await inferPdfPageCount(storedAbsolutePath);

  const document: StoredCustomMaterialRecord = {
    id: `custom-material-${crypto.randomUUID()}`,
    filename: input.filename,
    type: input.type,
    disciplineId: input.disciplineId,
    topicIds: input.topicIds,
    description: input.description,
    relevance: input.relevance,
    usage: input.usage,
    hasExercises: input.hasExercises,
    hasSolutions: input.hasSolutions,
    pageCount: inferredPageCount ?? 0,
    source: "custom",
    storagePath: storedRelativePath,
    uploadedAt,
  };

  const existingDocuments = await readCustomMaterialDocuments();
  await writeCustomMaterialDocuments([document, ...existingDocuments].sort(sortCustomDocuments));

  return document;
}
