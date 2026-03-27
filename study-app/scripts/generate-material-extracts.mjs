import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const appRoot = path.resolve(process.cwd());
const materialsDir = path.join(appRoot, "src", "data", "materials");
const documentsIndexPath = path.join(materialsDir, "documents-index.json");
const outputPath = path.join(materialsDir, "document-extracts.json");
const docsDirCandidates = [
  path.join(appRoot, "Documentos"),
  path.join(appRoot, "..", "Documentos"),
];

function resolveDocsDir() {
  for (const candidate of docsDirCandidates) {
    try {
      fs.accessSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return docsDirCandidates[docsDirCandidates.length - 1];
}

function normalizeText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fallbackPreview(document) {
  return [
    document.description,
    "",
    `Uso planejado: ${document.usage}`,
  ].join("\n");
}

async function main() {
  const documents = JSON.parse(await fsp.readFile(documentsIndexPath, "utf8"));
  const tempSwiftPath = path.join(os.tmpdir(), "pdf_extract_materials.swift");
  const swiftCachePath = path.join(os.tmpdir(), "swift-module-cache");

  await fsp.mkdir(swiftCachePath, { recursive: true });
  await fsp.writeFile(
    tempSwiftPath,
    [
      "import Foundation",
      "import PDFKit",
      "",
      "let path = CommandLine.arguments[1]",
      "let url = URL(fileURLWithPath: path)",
      "guard let doc = PDFDocument(url: url) else {",
      '  fputs("failed\\n", stderr)',
      "  exit(1)",
      "}",
      "for index in 0..<doc.pageCount {",
      "  if let page = doc.page(at: index), let text = page.string {",
      '    print("[[PAGE:\\(index + 1)]]")',
      "    print(text)",
      "  }",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );

  const docsDirPath = resolveDocsDir();
  const extracts = [];

  for (const document of documents) {
    const pdfPath = path.join(docsDirPath, document.filename);
    let preview = fallbackPreview(document);
    let extractedChars = preview.length;
    let truncated = false;

    try {
      const result = spawnSync(
        "swift",
        ["-module-cache-path", swiftCachePath, tempSwiftPath, pdfPath],
        {
          encoding: "utf8",
          maxBuffer: 40 * 1024 * 1024,
        },
      );

      if (result.status === 0 && result.stdout) {
        const normalized = normalizeText(result.stdout);
        if (normalized.length > 0) {
          truncated = normalized.length > 18000;
          preview = normalized.slice(0, 18000).trim();
          extractedChars = normalized.length;
        }
      }
    } catch {
      // Falls back to metadata preview.
    }

    extracts.push({
      id: document.id,
      preview,
      extractedChars,
      truncated,
    });
  }

  await fsp.writeFile(outputPath, JSON.stringify(extracts, null, 2) + "\n", "utf8");
  console.log(`Gerado: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
