"use client";

import { Copy, GripVertical, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { MermaidDiagram } from "./mermaid-diagram";
import type { RenderableBlockMode } from "@/lib/notes/renderable-blocks";
import { cn } from "@/lib/utils";

export function RenderableNoteBlock({
  code,
  mode,
  width,
  dragging,
  onCodeChange,
  onModeChange,
  onWidthChange,
  onCopy,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  code: string;
  mode: RenderableBlockMode;
  width: number;
  dragging: boolean;
  onCodeChange: (code: string) => void;
  onModeChange: (mode: RenderableBlockMode) => void;
  onWidthChange: (width: number) => void;
  onCopy: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.max(180, textarea.scrollHeight)}px`;
  }, [code, mode]);

  function startResize(event: React.PointerEvent<HTMLButtonElement>) {
    const container = wrapperRef.current?.parentElement;
    if (!container) return;

    const containerWidth = container.getBoundingClientRect().width;
    const startX = event.clientX;
    const startWidth = width;

    function handleMove(moveEvent: PointerEvent) {
      const delta = ((moveEvent.clientX - startX) / containerWidth) * 100;
      onWidthChange(startWidth + delta);
    }

    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  const showEditor = mode === "editor" || mode === "split";
  const showRender = mode === "render" || mode === "split";

  return (
    <div
      ref={wrapperRef}
      style={{ width: `${width}%` }}
      className={cn(
        "group relative max-w-full transition-[width,opacity] duration-200",
        dragging && "opacity-40",
      )}
    >
      <div className="overflow-hidden rounded-3xl border border-border-default bg-bg-primary shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              className="cursor-grab rounded-xl border border-border-default bg-bg-surface p-2 text-fg-muted transition-colors hover:text-fg-primary active:cursor-grabbing"
              aria-label="Arrastar bloco"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-muted">
                Bloco renderizavel
              </p>
              <p className="text-sm font-medium text-fg-primary">Mermaid</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ModeButton
              active={mode === "editor"}
              onClick={() => onModeChange("editor")}
            >
              Editor
            </ModeButton>
            <ModeButton
              active={mode === "split"}
              onClick={() => onModeChange("split")}
            >
              Split
            </ModeButton>
            <ModeButton
              active={mode === "render"}
              onClick={() => onModeChange("render")}
            >
              Render
            </ModeButton>
            <button
              type="button"
              onClick={onCopy}
              className="rounded-xl border border-border-default bg-bg-surface px-3 py-2 text-xs text-fg-secondary transition-colors hover:bg-bg-secondary hover:text-fg-primary"
            >
              <span className="flex items-center gap-2">
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </span>
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-accent-danger/25 px-3 py-2 text-xs text-accent-danger transition-colors hover:bg-accent-danger/10"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </span>
            </button>
          </div>
        </div>

        <div
          className={cn(
            "grid gap-0",
            mode === "split" ? "lg:grid-cols-2" : "grid-cols-1",
          )}
        >
          {showEditor && (
            <div className={cn(showRender && "border-b border-border-default/70 lg:border-b-0 lg:border-r")}>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(event) => onCodeChange(event.target.value)}
                rows={8}
                spellCheck={false}
                className="min-h-[220px] w-full resize-none bg-transparent px-5 py-4 font-mono text-sm leading-7 text-fg-primary outline-none"
              />
            </div>
          )}

          {showRender && (
            <div className="min-w-0 bg-bg-surface/40 p-4">
              <MermaidDiagram key={code} chart={code} />
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onPointerDown={startResize}
        className="absolute bottom-4 right-4 h-10 w-3 cursor-ew-resize rounded-full bg-border-default/70 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Redimensionar bloco"
      />
    </div>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-xs transition-colors",
        active
          ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
          : "border-border-default bg-bg-surface text-fg-secondary hover:bg-bg-secondary hover:text-fg-primary",
      )}
    >
      {children}
    </button>
  );
}
