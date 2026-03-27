"use client";

import { useLayoutEffect, useMemo, useRef } from "react";

interface SelectionOffsets {
  start: number;
  end: number;
}

function normalizeEditorText(text: string) {
  return text.replace(/\u00a0/g, " ").replace(/\r/g, "");
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSelectionOffsets(root: HTMLElement): SelectionOffsets | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return null;
  }

  const startRange = range.cloneRange();
  startRange.selectNodeContents(root);
  startRange.setEnd(range.startContainer, range.startOffset);

  const endRange = range.cloneRange();
  endRange.selectNodeContents(root);
  endRange.setEnd(range.endContainer, range.endOffset);

  return {
    start: normalizeEditorText(startRange.toString()).length,
    end: normalizeEditorText(endRange.toString()).length,
  };
}

function setSelectionOffsets(root: HTMLElement, start: number, end: number) {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  let remainingStart = start;
  let remainingEnd = end;
  let startNode: Node | null = null;
  let endNode: Node | null = null;
  let startOffset = 0;
  let endOffset = 0;

  while (currentNode) {
    const textLength = currentNode.textContent?.length ?? 0;

    if (!startNode && remainingStart <= textLength) {
      startNode = currentNode;
      startOffset = remainingStart;
    } else {
      remainingStart -= textLength;
    }

    if (!endNode && remainingEnd <= textLength) {
      endNode = currentNode;
      endOffset = remainingEnd;
    } else {
      remainingEnd -= textLength;
    }

    if (startNode && endNode) break;
    currentNode = walker.nextNode();
  }

  if (!startNode || !endNode) {
    const fallback = root.lastChild ?? root;
    range.selectNodeContents(fallback);
    range.collapse(false);
  } else {
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
  }

  selection.removeAllRanges();
  selection.addRange(range);
}

function renderInlineTextHtml(text: string) {
  if (!text) return "<br />";

  return escapeHtml(text);
}

function renderStyledLineHtml(line: string) {
  const headerMatch = line.match(/^(#{1,6})(\s+)(.*)$/);
  if (headerMatch) {
    const [, marks, spacing, content] = headerMatch;
    const level = Math.min(6, marks.length);
    const sizeClass =
      level === 1
        ? "text-4xl font-semibold tracking-tight"
        : level === 2
          ? "text-3xl font-semibold tracking-tight"
          : level === 3
            ? "text-2xl font-semibold"
            : level === 4
              ? "text-xl font-semibold"
              : "text-lg font-medium";

    return `<div class="min-h-[2.25rem] whitespace-pre-wrap break-words text-fg-primary ${sizeClass}"><span class="select-none text-fg-muted/45">${escapeHtml(marks)}</span>${escapeHtml(spacing)}<span>${renderInlineTextHtml(content)}</span></div>`;
  }

  const blockquoteMatch = line.match(/^(>\s?)(.*)$/);
  if (blockquoteMatch) {
    const [, mark, content] = blockquoteMatch;
    return `<div class="min-h-[2.25rem] border-l-2 border-accent-primary/40 pl-3 whitespace-pre-wrap break-words text-fg-secondary italic"><span class="select-none text-fg-muted/45">${escapeHtml(mark)}</span><span>${renderInlineTextHtml(content)}</span></div>`;
  }

  const unorderedListMatch = line.match(/^([-*+]\s+)(.*)$/);
  if (unorderedListMatch) {
    const [, mark, content] = unorderedListMatch;
    return `<div class="min-h-[2.25rem] whitespace-pre-wrap break-words pl-6 text-fg-primary"><span class="select-none -ml-6 inline-block w-6 text-fg-muted/55">${escapeHtml(mark)}</span><span>${renderInlineTextHtml(content)}</span></div>`;
  }

  const orderedListMatch = line.match(/^(\d+\.\s+)(.*)$/);
  if (orderedListMatch) {
    const [, mark, content] = orderedListMatch;
    return `<div class="min-h-[2.25rem] whitespace-pre-wrap break-words pl-9 text-fg-primary"><span class="select-none -ml-9 inline-block w-9 text-fg-muted/55">${escapeHtml(mark)}</span><span>${renderInlineTextHtml(content)}</span></div>`;
  }

  const fenceMatch = line.match(/^(```.*)$/);
  if (fenceMatch) {
    return `<div class="min-h-[2.25rem] rounded-xl bg-bg-surface px-3 py-2 font-mono text-sm text-accent-warning">${escapeHtml(line)}</div>`;
  }

  return `<div class="min-h-[2.25rem] whitespace-pre-wrap break-words text-[17px] leading-9 text-fg-primary">${renderInlineTextHtml(line)}</div>`;
}

function renderSegmentHtml(value: string) {
  return value
    .split("\n")
    .map((line) => renderStyledLineHtml(line))
    .join("");
}

export function LiveMarkdownSegment({
  value,
  placeholder,
  onChange,
  onSelectionChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string, selectionStart: number, selectionEnd: number) => void;
  onSelectionChange: (selectionStart: number, selectionEnd: number) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const pendingSelectionRef = useRef<SelectionOffsets | null>(null);

  const renderedHtml = useMemo(() => renderSegmentHtml(value), [value]);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    const pending = pendingSelectionRef.current;
    if (!editor || !pending) return;

    setSelectionOffsets(editor, pending.start, pending.end);
    pendingSelectionRef.current = null;
  }, [value]);

  function handleInput() {
    const editor = editorRef.current;
    if (!editor) return;

    const normalizedValue = normalizeEditorText(editor.innerText);
    const selection = getSelectionOffsets(editor) ?? {
      start: normalizedValue.length,
      end: normalizedValue.length,
    };

    pendingSelectionRef.current = selection;
    onChange(normalizedValue, selection.start, selection.end);
  }

  function handleSelectionUpdate() {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = getSelectionOffsets(editor);
    if (!selection) return;
    onSelectionChange(selection.start, selection.end);
  }

  return (
    <div className="relative">
      {value.length === 0 && placeholder ? (
        <div className="pointer-events-none absolute inset-0 whitespace-pre-wrap text-[17px] leading-9 text-fg-muted/70">
          {placeholder}
        </div>
      ) : null}

      <div
        ref={editorRef}
        contentEditable
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
        suppressContentEditableWarning
        spellCheck={false}
        onInput={handleInput}
        onClick={handleSelectionUpdate}
        onKeyUp={handleSelectionUpdate}
        onSelect={handleSelectionUpdate}
        className="min-h-[2.25rem] whitespace-pre-wrap break-words outline-none"
      />
    </div>
  );
}
