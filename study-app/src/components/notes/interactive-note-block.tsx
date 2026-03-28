"use client";

import { Copy, GripVertical, Smartphone, Trash2, Monitor, Code2, Eye, Columns2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type InteractiveBlockFrame,
  type RenderableBlockMode,
} from "@/lib/notes/renderable-blocks";
import { cn } from "@/lib/utils";
import { InteractiveArtifactPreview } from "./interactive-artifact-preview";

export function InteractiveNoteBlock({
  code,
  title,
  mode,
  width,
  frame,
  preferredHeight,
  dragging,
  onCodeChange,
  onModeChange,
  onWidthChange,
  onFrameChange,
  onCopy,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  code: string;
  title: string;
  mode: RenderableBlockMode;
  width: number;
  frame: InteractiveBlockFrame;
  preferredHeight: number;
  dragging: boolean;
  onCodeChange: (code: string) => void;
  onModeChange: (mode: RenderableBlockMode) => void;
  onWidthChange: (width: number) => void;
  onFrameChange: (frame: InteractiveBlockFrame) => void;
  onCopy: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`;
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
        "group/block relative max-w-full transition-[width,opacity] duration-200",
        dragging && "opacity-40",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Floating compact toolbar — visible on hover */}
      <div
        className={cn(
          "absolute -top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border-default/60 bg-bg-primary/95 px-2 py-1 shadow-lg backdrop-blur-sm transition-all duration-200",
          hovered || mode === "editor"
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-1 opacity-0",
        )}
      >
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="cursor-grab rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-bg-secondary hover:text-fg-primary active:cursor-grabbing"
          aria-label="Arrastar bloco"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <div className="mx-0.5 h-4 w-px bg-border-default/50" />

        {/* Frame toggles */}
        <FrameIcon
          active={frame === "phone"}
          onClick={() => onFrameChange("phone")}
          title="Celular"
        >
          <Smartphone className="h-3.5 w-3.5" />
        </FrameIcon>
        <FrameIcon
          active={frame === "canvas"}
          onClick={() => onFrameChange("canvas")}
          title="Canvas"
        >
          <Monitor className="h-3.5 w-3.5" />
        </FrameIcon>

        <div className="mx-0.5 h-4 w-px bg-border-default/50" />

        {/* Mode toggles */}
        <ModeIcon
          active={mode === "editor"}
          onClick={() => onModeChange("editor")}
          title="Editor"
        >
          <Code2 className="h-3.5 w-3.5" />
        </ModeIcon>
        <ModeIcon
          active={mode === "split"}
          onClick={() => onModeChange("split")}
          title="Split"
        >
          <Columns2 className="h-3.5 w-3.5" />
        </ModeIcon>
        <ModeIcon
          active={mode === "render"}
          onClick={() => onModeChange("render")}
          title="Render"
        >
          <Eye className="h-3.5 w-3.5" />
        </ModeIcon>

        <div className="mx-0.5 h-4 w-px bg-border-default/50" />

        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-bg-secondary hover:text-fg-primary"
          title="Copiar"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-accent-danger/10 hover:text-accent-danger"
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Title label */}
        {title && (
          <>
            <div className="mx-0.5 h-4 w-px bg-border-default/50" />
            <span className="max-w-[140px] truncate px-1 text-[11px] text-fg-muted">
              {title}
            </span>
          </>
        )}
      </div>

      {/* Content area — minimal border, blends with note */}
      <div
        className={cn(
          "overflow-hidden rounded-2xl transition-all duration-200",
          hovered
            ? "border border-border-default/60 bg-bg-surface/30 shadow-sm"
            : "border border-transparent bg-transparent",
        )}
      >
        <div
          className={cn(
            "grid gap-0",
            mode === "split" ? "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "grid-cols-1",
          )}
        >
          {showEditor && (
            <div className={cn(
              showRender && "border-b border-border-default/40 xl:border-b-0 xl:border-r",
            )}>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(event) => onCodeChange(event.target.value)}
                rows={10}
                spellCheck={false}
                className="min-h-[200px] w-full resize-none bg-transparent px-4 py-3 font-mono text-sm leading-7 text-fg-primary outline-none placeholder:text-fg-muted"
                placeholder="HTML/CSS/JS..."
              />
            </div>
          )}

          {showRender && (
            <div className="min-w-0 p-3">
              <InteractiveArtifactPreview
                html={code}
                frame={frame}
                title={title}
                preferredHeight={preferredHeight}
              />
            </div>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <button
        type="button"
        onPointerDown={startResize}
        className={cn(
          "absolute bottom-3 right-2 h-8 w-2 cursor-ew-resize rounded-full bg-border-default/50 transition-opacity",
          hovered ? "opacity-60" : "opacity-0",
        )}
        aria-label="Redimensionar bloco"
      />
    </div>
  );
}

function ModeIcon({
  active,
  children,
  onClick,
  title,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded-lg p-1.5 transition-colors",
        active
          ? "bg-accent-primary/15 text-accent-primary"
          : "text-fg-muted hover:bg-bg-secondary hover:text-fg-primary",
      )}
    >
      {children}
    </button>
  );
}

function FrameIcon({
  active,
  children,
  onClick,
  title,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded-lg p-1.5 transition-colors",
        active
          ? "bg-emerald-400/15 text-emerald-300"
          : "text-fg-muted hover:bg-bg-secondary hover:text-fg-primary",
      )}
    >
      {children}
    </button>
  );
}
