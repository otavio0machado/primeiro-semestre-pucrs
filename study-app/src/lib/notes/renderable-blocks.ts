"use client";

export type RenderableBlockMode = "editor" | "split" | "render";
export type InteractiveBlockFrame = "phone" | "canvas";

interface BaseRenderableBlockMeta {
  mode: RenderableBlockMode;
  width: number;
}

export type MermaidBlockMeta = BaseRenderableBlockMeta;

export interface InteractiveBlockMeta extends BaseRenderableBlockMeta {
  frame: InteractiveBlockFrame;
  height: number;
  title: string;
}

export type RenderableNoteItem =
  | { type: "mermaid"; code: string; meta: MermaidBlockMeta }
  | { type: "interactive"; code: string; meta: InteractiveBlockMeta };

export type NoteEditorItem =
  | { type: "text"; text: string }
  | RenderableNoteItem;

const DEFAULT_MERMAID_META: MermaidBlockMeta = {
  mode: "split",
  width: 100,
};

const DEFAULT_INTERACTIVE_META: InteractiveBlockMeta = {
  mode: "split",
  width: 100,
  frame: "canvas",
  height: 720,
  title: "Experiencia interativa",
};

function clampWidth(value: number) {
  return Math.min(100, Math.max(45, Math.round(value)));
}

function clampHeight(value: number) {
  return Math.min(1200, Math.max(420, Math.round(value)));
}

function encodeMetaValue(value: string | number) {
  if (typeof value === "number") return `${value}`;
  if (!/[\s"]/.test(value)) return value;
  return `"${value.replace(/"/g, "'")}"`;
}

function parseMermaidMeta(rawMeta?: string): MermaidBlockMeta {
  const meta = { ...DEFAULT_MERMAID_META };
  if (!rawMeta) return meta;
  const matches = rawMeta.matchAll(/([a-z-]+)=("[^"]+"|\S+)/g);

  for (const match of matches) {
    const key = match[1];
    const value = match[2].replace(/^"(.*)"$/, "$1");

    if (key === "view" && ["editor", "split", "render"].includes(value)) {
      meta.mode = value as RenderableBlockMode;
    }

    if (key === "width") {
      meta.width = clampWidth(Number(value));
    }
  }

  return meta;
}

function parseInteractiveMeta(rawMeta?: string): InteractiveBlockMeta {
  const meta = { ...DEFAULT_INTERACTIVE_META };
  if (!rawMeta) return meta;

  const matches = rawMeta.matchAll(/([a-z-]+)=("[^"]+"|\S+)/g);

  for (const match of matches) {
    const key = match[1];
    const value = match[2].replace(/^"(.*)"$/, "$1");

    if (key === "view" && ["editor", "split", "render"].includes(value)) {
      meta.mode = value as RenderableBlockMode;
    }

    if (key === "width") {
      meta.width = clampWidth(Number(value));
    }

    if (key === "frame" && ["phone", "canvas"].includes(value)) {
      meta.frame = value as InteractiveBlockFrame;
    }

    if (key === "height") {
      meta.height = clampHeight(Number(value));
    }

    if (key === "title" && value.trim()) {
      meta.title = value.trim();
    }
  }

  return meta;
}

export function serializeMermaidBlock(
  code: string,
  meta?: Partial<MermaidBlockMeta>,
) {
  const merged = {
    ...DEFAULT_MERMAID_META,
    ...meta,
  };

  return `\`\`\`mermaid view=${merged.mode} width=${clampWidth(merged.width)}\n${code.trimEnd()}\n\`\`\``;
}

export function serializeInteractiveBlock(
  code: string,
  meta?: Partial<InteractiveBlockMeta>,
) {
  const merged = {
    ...DEFAULT_INTERACTIVE_META,
    ...meta,
  };

  return `\`\`\`interactive view=${merged.mode} width=${clampWidth(merged.width)} frame=${merged.frame} height=${clampHeight(merged.height)} title=${encodeMetaValue(merged.title)}\n${code.trimEnd()}\n\`\`\``;
}

export function serializeRenderableBlock(item: RenderableNoteItem) {
  if (item.type === "mermaid") {
    return serializeMermaidBlock(item.code, item.meta);
  }

  return serializeInteractiveBlock(item.code, item.meta);
}

export function parseRenderableNoteContent(content: string): NoteEditorItem[] {
  const items: NoteEditorItem[] = [];
  const regex = /```(mermaid|interactive)([^\n]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;

  for (const match of content.matchAll(regex)) {
    const fullMatch = match[0];
    const type = match[1];
    const meta = match[2];
    const code = match[3];
    const index = match.index ?? 0;

    items.push({
      type: "text",
      text: content.slice(lastIndex, index),
    });

    if (type === "interactive") {
      items.push({
        type: "interactive",
        code: code.replace(/\n$/, ""),
        meta: parseInteractiveMeta(meta),
      });
    } else {
      items.push({
        type: "mermaid",
        code: code.replace(/\n$/, ""),
        meta: parseMermaidMeta(meta),
      });
    }

    lastIndex = index + fullMatch.length;
  }

  items.push({
    type: "text",
    text: content.slice(lastIndex),
  });

  return normalizeEditorItems(items);
}

export function normalizeEditorItems(items: NoteEditorItem[]) {
  const normalized: NoteEditorItem[] = [];

  for (const item of items) {
    if (item.type === "text") {
      const previous = normalized[normalized.length - 1];
      if (previous?.type === "text") {
        previous.text += item.text;
      } else {
        normalized.push({ ...item });
      }
      continue;
    }

    if (item.type === "interactive") {
      normalized.push({
        type: "interactive",
        code: item.code,
        meta: {
          mode: item.meta.mode,
          width: clampWidth(item.meta.width),
          frame: item.meta.frame,
          height: clampHeight(item.meta.height),
          title: item.meta.title.trim() || DEFAULT_INTERACTIVE_META.title,
        },
      });
      continue;
    }

    normalized.push({
      type: "mermaid",
      code: item.code,
      meta: {
        mode: item.meta.mode,
        width: clampWidth(item.meta.width),
      },
    });
  }

  if (normalized.length === 0) {
    normalized.push({ type: "text", text: "" });
  }

  return normalized;
}

export function serializeRenderableNoteContent(items: NoteEditorItem[]) {
  const normalized = normalizeEditorItems(items);
  let result = "";

  normalized.forEach((item, index) => {
    if (item.type === "text") {
      result += item.text;
      return;
    }

    const blockText = serializeRenderableBlock(item);
    const next = normalized[index + 1];

    if (result.length > 0 && !result.endsWith("\n\n")) {
      result += result.endsWith("\n") ? "\n" : "\n\n";
    }

    result += blockText;

    if (next?.type === "text" && next.text.length > 0 && !next.text.startsWith("\n\n")) {
      result += "\n\n";
    }
  });

  return result;
}

export function createInsertedBlockText({
  text,
  start,
  end,
  blockMarkdown,
}: {
  text: string;
  start: number;
  end: number;
  blockMarkdown: string;
}) {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const needsLeadingBreak =
    before.length > 0 && !before.endsWith("\n\n");
  const needsTrailingBreak =
    after.length > 0 && !after.startsWith("\n\n");

  return [
    before,
    needsLeadingBreak ? "\n\n" : "",
    blockMarkdown,
    needsTrailingBreak ? "\n\n" : "",
    after,
  ].join("");
}
