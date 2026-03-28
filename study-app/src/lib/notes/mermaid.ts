const DIAGRAM_STARTERS = [
  "flowchart",
  "graph",
  "mindmap",
  "sequenceDiagram",
  "journey",
  "quadrantChart",
  "xychart",
] as const;

function clampUnit(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  const clamped = Math.min(1, Math.max(0, parsed));
  if (Number.isInteger(clamped)) return `${clamped}`;
  return clamped.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function trimFence(raw: string) {
  return raw
    .replace(/^```(?:mermaid)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function isLikelyNarrativeLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(O|A|Os|As|This|The|Esse|Essa|Estas|Estes)\s/i.test(trimmed)) {
    return true;
  }
  return /^[A-ZÀ-Ý][^:[\]{}()<>-]{40,}$/.test(trimmed);
}

function extractFromFirstStarter(raw: string) {
  const text = trimFence(raw);
  const lines = text.split("\n");
  const starterIndex = lines.findIndex((line) =>
    DIAGRAM_STARTERS.some((starter) => line.trim().startsWith(starter)),
  );

  return starterIndex >= 0 ? lines.slice(starterIndex).join("\n").trim() : text;
}

function normalizeQuadrantTextLine(line: string, prefix: string) {
  const body = line.trim().slice(prefix.length).trim();
  return `${prefix} ${body.replace(/^"(.*)"$/, "$1")}`.trimEnd();
}

function normalizeAxisLine(line: string, prefix: "x-axis" | "y-axis") {
  const body = line.trim().slice(prefix.length).trim();
  const parts = body.split(/\s*-->\s*/);
  const cleaned = parts.map((part) => part.replace(/^"(.*)"$/, "$1").trim());
  return `${prefix} ${cleaned.join(" --> ")}`.trimEnd();
}

function normalizeQuadrantChart(raw: string) {
  const lines = extractFromFirstStarter(raw).split("\n");
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push("");
      continue;
    }

    if (result.length === 0) {
      result.push("quadrantChart");
      continue;
    }

    if (trimmed.startsWith("title ")) {
      result.push(`    ${normalizeQuadrantTextLine(trimmed, "title")}`);
      continue;
    }

    if (trimmed.startsWith("x-axis ")) {
      result.push(`    ${normalizeAxisLine(trimmed, "x-axis")}`);
      continue;
    }

    if (trimmed.startsWith("y-axis ")) {
      result.push(`    ${normalizeAxisLine(trimmed, "y-axis")}`);
      continue;
    }

    if (/^quadrant-[1-4]\s+/.test(trimmed)) {
      const prefix = trimmed.match(/^quadrant-[1-4]/)?.[0] ?? "quadrant-1";
      result.push(`    ${normalizeQuadrantTextLine(trimmed, prefix)}`);
      continue;
    }

    const pointMatch = trimmed.match(/^"?(.*?)"?\s*:\s*\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\](.*)$/);
    if (pointMatch) {
      const [, label, x, y, suffix] = pointMatch;
      const safeLabel = label.replace(/^"(.*)"$/, "$1").trim();
      result.push(`    ${safeLabel}: [${clampUnit(x)}, ${clampUnit(y)}]${suffix}`.trimEnd());
      continue;
    }

    if (/^(classDef|style)\s+/.test(trimmed)) {
      result.push(`    ${trimmed}`);
      continue;
    }

    if (isLikelyNarrativeLine(trimmed)) {
      break;
    }
  }

  return result.join("\n").trim();
}

function normalizeXyChart(raw: string) {
  const lines = extractFromFirstStarter(raw).split("\n");
  const result: string[] = [];
  let hasData = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push("");
      continue;
    }

    if (result.length === 0) {
      const header = trimmed.startsWith("xychart") ? trimmed : "xychart";
      result.push(header);
      continue;
    }

    if (
      /^(title|x-axis|y-axis)\s+/.test(trimmed) ||
      /^(line|bar)\s+\[/.test(trimmed)
    ) {
      if (/^(line|bar)\s+\[/.test(trimmed)) hasData = true;
      result.push(`    ${trimmed}`);
      continue;
    }

    if (isLikelyNarrativeLine(trimmed)) {
      break;
    }
  }

  // xychart without data (line/bar) will crash mermaid — add a placeholder
  if (!hasData) {
    result.push("    line [0, 0]");
  }

  return result.join("\n").trim();
}

export function normalizeMermaidChart(raw: string) {
  const extracted = extractFromFirstStarter(raw);
  const firstLine = extracted.split("\n")[0]?.trim() ?? "";

  if (firstLine.startsWith("quadrantChart")) {
    return normalizeQuadrantChart(extracted);
  }

  if (firstLine.startsWith("xychart")) {
    return normalizeXyChart(extracted);
  }

  const lines = extracted.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (result.length > 0 && isLikelyNarrativeLine(trimmed.trim())) {
      break;
    }
    result.push(trimmed);
  }

  return result.join("\n").trim();
}
