"use client";

import {
  BookOpen,
  Brain,
  FilePlus2,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createInsertedBlockText,
  parseRenderableNoteContent,
  serializeRenderableBlock,
  serializeRenderableNoteContent,
  type InteractiveBlockMeta,
  type MermaidBlockMeta,
  type NoteEditorItem,
  type RenderableNoteItem,
} from "@/lib/notes/renderable-blocks";
import { createFlashcard } from "@/lib/services/flashcards";
import { cn } from "@/lib/utils";
import type {
  ContentStatus,
  Discipline,
  MasteryLevel,
  Note,
  NoteFormat,
  Topic,
} from "@/lib/supabase";
import { AiActionModal } from "./ai-action-modal";
import { GraphGeneratorModal, type MermaidGraphType } from "./graph-generator-modal";
import {
  InteractiveGeneratorModal,
  type InteractiveFrameHint,
} from "./interactive-generator-modal";
import { InteractiveNoteBlock } from "./interactive-note-block";
import { LiveMarkdownSegment } from "./live-markdown-segment";
import { RenderableNoteBlock } from "./renderable-note-block";

type ContentGenerationFormat = "cornell" | "outline" | "concept-map" | "summary";
type ContentInsertMode = "append" | "replace";

interface NoteDraft {
  id?: string;
  title: string;
  content: string;
  topic_id: string;
  discipline_id: string;
  format: NoteFormat;
  status: ContentStatus;
  tags: string[];
  key_concepts: string[];
}

type SavePayload = NoteDraft;

function buildBlankDraft(
  disciplines: Discipline[],
  topics: Topic[],
  preferredDisciplineId?: string,
): NoteDraft {
  const disciplineId =
    preferredDisciplineId && preferredDisciplineId !== "all"
      ? preferredDisciplineId
      : disciplines[0]?.id ?? "";
  const topicId =
    topics.find((topic) => topic.discipline_id === disciplineId)?.id ?? "";

  return {
    title: "Nova nota",
    content: "",
    topic_id: topicId,
    discipline_id: disciplineId,
    format: "free",
    status: "draft",
    tags: [],
    key_concepts: [],
  };
}

function noteToDraft(note: Note): NoteDraft {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    topic_id: note.topic_id,
    discipline_id: note.discipline_id,
    format: note.format,
    status: note.status,
    tags: note.tags,
    key_concepts: note.key_concepts,
  };
}

function snapshotDraft(draft: NoteDraft) {
  return JSON.stringify({
    title: draft.title,
    content: draft.content,
    topic_id: draft.topic_id,
    discipline_id: draft.discipline_id,
    format: draft.format,
    status: draft.status,
    tags: draft.tags,
    key_concepts: draft.key_concepts,
  });
}

function noteFormatToAiFormat(format: NoteFormat): ContentGenerationFormat {
  if (format === "cornell" || format === "outline" || format === "summary") {
    return format;
  }

  return "concept-map";
}

function aiFormatToNoteFormat(format: ContentGenerationFormat): NoteFormat {
  if (format === "concept-map") return "concept_map";
  return format;
}

function masteryLevelFromStatus(status: ContentStatus): MasteryLevel {
  if (status === "done") return "proficient";
  if (status === "review") return "developing";
  return "exposed";
}

function clampWidth(width: number) {
  return Math.min(100, Math.max(45, Math.round(width)));
}

function findLastTextIndex(items: NoteEditorItem[]) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (items[index]?.type === "text") return index;
  }
  return 0;
}

function isLikelyInteractiveRequest(request: string) {
  return /\b(dashboard|mockup|wireframe|interface|layout|landing page|app|mobile|celular|iphone|android|tela)\b/i.test(
    request,
  );
}

export function NotesWorkspace({
  notes,
  disciplines,
  topics,
  preferredDisciplineId,
  search,
  onSearchChange,
  onSaveNote,
  onDeleteNote,
  onToast,
  onRefreshData,
}: {
  notes: Note[];
  disciplines: Discipline[];
  topics: Topic[];
  preferredDisciplineId: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSaveNote: (payload: SavePayload) => Promise<Note>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onToast: (message: string, type?: "success" | "error") => void;
  onRefreshData: () => Promise<void>;
}) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id ?? null);
  const [isCreatingNote, setIsCreatingNote] = useState(notes.length === 0);
  const [draft, setDraft] = useState<NoteDraft>(() =>
    notes[0]
      ? noteToDraft(notes[0])
      : buildBlankDraft(disciplines, topics, preferredDisciplineId),
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshotDraft(draft));
  const [saving, setSaving] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [graphGenerating, setGraphGenerating] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [interactiveModalOpen, setInteractiveModalOpen] = useState(false);
  const [interactiveGenerating, setInteractiveGenerating] = useState(false);
  const [interactiveError, setInteractiveError] = useState<string | null>(null);
  const [metaOpen, setMetaOpen] = useState(false);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [contentGenerating, setContentGenerating] = useState(false);
  const [flashcardsGenerating, setFlashcardsGenerating] = useState(false);
  const [contentRequest, setContentRequest] = useState("");
  const [contentFormat, setContentFormat] = useState<ContentGenerationFormat>(
    noteFormatToAiFormat(draft.format),
  );
  const [contentInsertMode, setContentInsertMode] =
    useState<ContentInsertMode>("append");
  const [flashcardRequest, setFlashcardRequest] = useState("");
  const [flashcardCount, setFlashcardCount] = useState(5);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const cursorRef = useRef({ itemIndex: 0, start: 0, end: 0 });

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (preferredDisciplineId !== "all" && note.discipline_id !== preferredDisciplineId) {
        return false;
      }

      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [notes, preferredDisciplineId, search]);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? null,
    [activeNoteId, notes],
  );

  const draftTopics = useMemo(
    () =>
      topics.filter((topic) =>
        draft.discipline_id ? topic.discipline_id === draft.discipline_id : true,
      ),
    [draft.discipline_id, topics],
  );

  const activeDiscipline = useMemo(
    () =>
      disciplines.find((discipline) => discipline.id === draft.discipline_id) ?? null,
    [disciplines, draft.discipline_id],
  );

  const activeTopic = useMemo(
    () => topics.find((topic) => topic.id === draft.topic_id) ?? null,
    [draft.topic_id, topics],
  );

  const editorItems = useMemo(
    () => parseRenderableNoteContent(draft.content),
    [draft.content],
  );

  const isDirty = snapshotDraft(draft) !== savedSnapshot;

  useEffect(() => {
    if (!isCreatingNote && !activeNoteId && notes.length > 0) {
      const fallback = filteredNotes[0] ?? notes[0];
      if (fallback) {
        setActiveNoteId(fallback.id);
        const nextDraft = noteToDraft(fallback);
        setDraft(nextDraft);
        setSavedSnapshot(snapshotDraft(nextDraft));
      }
    }
  }, [activeNoteId, filteredNotes, isCreatingNote, notes]);

  useEffect(() => {
    if (!activeNoteId && notes.length === 0) {
      const blank = buildBlankDraft(disciplines, topics, preferredDisciplineId);
      setIsCreatingNote(true);
      setDraft(blank);
      setSavedSnapshot(snapshotDraft(blank));
      setContentFormat(noteFormatToAiFormat(blank.format));
      return;
    }

    if (activeNote) {
      setIsCreatingNote(false);
      const nextDraft = noteToDraft(activeNote);
      setDraft(nextDraft);
      setSavedSnapshot(snapshotDraft(nextDraft));
      setContentFormat(noteFormatToAiFormat(nextDraft.format));
      setGraphError(null);
      setInteractiveError(null);
    }
  }, [activeNote, activeNoteId, disciplines, notes.length, preferredDisciplineId, topics]);

  const persistDraft = useCallback(
    async (showToast = false) => {
      if (!draft.title.trim()) {
        if (showToast) onToast("Defina um título para a nota.", "error");
        return null;
      }

      if (!draft.topic_id) {
        if (showToast) onToast("Selecione um tópico para a nota.", "error");
        return null;
      }

      setSaving(true);

      try {
        const saved = await onSaveNote({
          ...draft,
          title: draft.title.trim(),
          content: draft.content,
        });

        const nextDraft = noteToDraft(saved);
        setIsCreatingNote(false);
        setActiveNoteId(saved.id);
        setDraft(nextDraft);
        setSavedSnapshot(snapshotDraft(nextDraft));

        if (showToast) {
          onToast("Nota salva com sucesso.");
        }

        return saved;
      } catch (error) {
        onToast(
          error instanceof Error ? error.message : "Erro ao salvar nota.",
          "error",
        );
        return null;
      } finally {
        setSaving(false);
      }
    },
    [draft, onSaveNote, onToast],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void persistDraft(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [persistDraft]);

  useEffect(() => {
    if (!isDirty || saving || !draft.content.trim() || !draft.title.trim() || !draft.topic_id) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void persistDraft(false);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [
    draft.content,
    draft.discipline_id,
    draft.format,
    draft.key_concepts,
    draft.status,
    draft.tags,
    draft.title,
    draft.topic_id,
    isDirty,
    persistDraft,
    saving,
  ]);

  function setDraftContent(content: string) {
    setDraft((current) => ({
      ...current,
      content,
    }));
  }

  function syncCursor(
    itemIndex: number,
    selectionStart: number,
    selectionEnd: number,
  ) {
    cursorRef.current = {
      itemIndex,
      start: selectionStart,
      end: selectionEnd,
    };
  }

  async function safelySwitchNote(note: Note) {
    if (note.id === activeNoteId) return;

    if (isDirty) {
      const saved = await persistDraft(false);
      if (!saved && !window.confirm("Existem alterações não salvas. Deseja descartá-las?")) {
        return;
      }
    }

    setIsCreatingNote(false);
    setActiveNoteId(note.id);
    setMetaOpen(false);
    setDraggedBlockIndex(null);
  }

  async function handleCreateNote() {
    if (isDirty) {
      const saved = await persistDraft(false);
      if (!saved && !window.confirm("Existem alterações não salvas. Deseja descartá-las e criar uma nova nota?")) {
        return;
      }
    }

    const blank = buildBlankDraft(disciplines, topics, preferredDisciplineId);
    setIsCreatingNote(true);
    setActiveNoteId(null);
    setDraft(blank);
    setSavedSnapshot(snapshotDraft(blank));
    setContentFormat(noteFormatToAiFormat(blank.format));
    setMetaOpen(false);
    setGraphError(null);
    setInteractiveError(null);
    requestAnimationFrame(() => titleRef.current?.focus());
  }

  function updateDraft<K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value };

      if (key === "discipline_id") {
        const firstTopic =
          topics.find((topic) => topic.discipline_id === value)?.id ?? "";
        next.topic_id = firstTopic;
      }

      if (key === "format") {
        setContentFormat(noteFormatToAiFormat(value as NoteFormat));
      }

      return next;
    });
  }

  async function handleDelete() {
    if (!activeNoteId) {
      onToast("A nota ainda não foi salva.", "error");
      return;
    }

    if (!window.confirm("Tem certeza que deseja deletar esta nota?")) {
      return;
    }

    try {
      await onDeleteNote(activeNoteId);
      const fallback =
        filteredNotes.find((note) => note.id !== activeNoteId) ??
        notes.find((note) => note.id !== activeNoteId) ??
        null;
      setIsCreatingNote(!fallback);
      setActiveNoteId(fallback?.id ?? null);
      if (!fallback) {
        const blank = buildBlankDraft(disciplines, topics, preferredDisciplineId);
        setDraft(blank);
        setSavedSnapshot(snapshotDraft(blank));
        setContentFormat(noteFormatToAiFormat(blank.format));
      }
      setMetaOpen(false);
      setDraggedBlockIndex(null);
    } catch (error) {
      onToast(
        error instanceof Error ? error.message : "Erro ao deletar nota.",
        "error",
      );
    }
  }

  function updateTextItem(itemIndex: number, text: string) {
    const items = parseRenderableNoteContent(draft.content);
    const item = items[itemIndex];
    if (!item || item.type !== "text") return;

    items[itemIndex] = {
      type: "text",
      text,
    };

    setDraftContent(serializeRenderableNoteContent(items));
  }

  function updateRenderableItem(
    itemIndex: number,
    changes: {
      code?: string;
      meta?: Partial<MermaidBlockMeta | InteractiveBlockMeta>;
    },
  ) {
    const items = parseRenderableNoteContent(draft.content);
    const item = items[itemIndex];
    if (!item || item.type === "text") return;

    if (item.type === "interactive") {
      items[itemIndex] = {
        type: "interactive",
        code: changes.code ?? item.code,
        meta: {
          ...item.meta,
          ...(changes.meta as Partial<InteractiveBlockMeta> | undefined),
          width: clampWidth(changes.meta?.width ?? item.meta.width),
        },
      };
    } else {
      items[itemIndex] = {
        type: "mermaid",
        code: changes.code ?? item.code,
        meta: {
          ...item.meta,
          ...(changes.meta as Partial<MermaidBlockMeta> | undefined),
          width: clampWidth(changes.meta?.width ?? item.meta.width),
        },
      };
    }

    setDraftContent(serializeRenderableNoteContent(items));
  }

  function removeRenderableItem(itemIndex: number) {
    const items = parseRenderableNoteContent(draft.content);
    const item = items[itemIndex];
    if (!item || item.type === "text") return;

    items.splice(itemIndex, 1);
    setDraftContent(serializeRenderableNoteContent(items));
  }

  async function copyRenderableItem(itemIndex: number) {
    const items = parseRenderableNoteContent(draft.content);
    const item = items[itemIndex];
    if (!item || item.type === "text") return;

    try {
      await navigator.clipboard.writeText(serializeRenderableBlock(item));
      onToast("Bloco copiado. Você pode colar em qualquer ponto da nota.");
    } catch {
      onToast("Não foi possível copiar o bloco.", "error");
    }
  }

  function moveRenderableBlock(blockIndex: number, boundaryIndex: number) {
    const items = parseRenderableNoteContent(draft.content);
    const block = items[blockIndex];
    if (!block || block.type === "text") return;

    items.splice(blockIndex, 1);

    let insertIndex = boundaryIndex;
    if (blockIndex < boundaryIndex) {
      insertIndex -= 1;
    }

    items.splice(insertIndex, 0, block);
    setDraftContent(serializeRenderableNoteContent(items));
    setDraggedBlockIndex(null);
  }

  function insertRenderableBlockAtCursor(block: RenderableNoteItem) {
    const items = parseRenderableNoteContent(draft.content);
    const selection = cursorRef.current;
    const blockMarkdown = serializeRenderableBlock(block);

    let targetIndex = selection.itemIndex;
    let start = selection.start;
    let end = selection.end;

    if (!items[targetIndex] || items[targetIndex].type !== "text") {
      targetIndex = findLastTextIndex(items);
      const fallback = items[targetIndex];
      start = fallback?.type === "text" ? fallback.text.length : 0;
      end = start;
    }

    const target = items[targetIndex];
    if (!target || target.type !== "text") return;

    items[targetIndex] = {
      type: "text",
      text: createInsertedBlockText({
        text: target.text,
        start,
        end,
        blockMarkdown,
      }),
    };

    setDraftContent(serializeRenderableNoteContent(items));
  }

  async function handleGenerateGraph({
    graphType,
    request,
  }: {
    graphType: MermaidGraphType;
    request: string;
  }) {
    if (isLikelyInteractiveRequest(request)) {
      const message =
        'Esse pedido parece uma interface interativa. Use "Gerar interativo" para gerar um bloco responsivo na nota.';
      setGraphError(message);
      onToast(message, "error");
      return;
    }

    setGraphGenerating(true);
    setGraphError(null);

    try {
      const response = await fetch("/api/ai/note-graph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          graphType,
          request,
          noteContent: draft.content,
          courseName: activeDiscipline?.name,
          topicName: activeTopic?.name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message ?? "Falha ao gerar gráfico.");
      }

      const result = data.data as {
        title: string;
        mermaid: string;
        explanation: string;
      };

      insertRenderableBlockAtCursor({
        type: "mermaid",
        code: result.mermaid.trim(),
        meta: {
          mode: "split",
          width: 100,
        },
      });
      setGraphModalOpen(false);
      onToast("Bloco Mermaid inserido na nota.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao gerar gráfico.";
      setGraphError(message);
      onToast(message, "error");
    } finally {
      setGraphGenerating(false);
    }
  }

  async function handleGenerateInteractive({
    request,
    frameHint,
  }: {
    request: string;
    frameHint: InteractiveFrameHint;
  }) {
    if (!draft.content.trim() && !request.trim()) {
      onToast("Escreva algo na nota ou descreva o que a IA deve gerar.", "error");
      return;
    }

    setInteractiveGenerating(true);
    setInteractiveError(null);

    try {
      const response = await fetch("/api/ai/note-interactive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request,
          frameHint,
          noteContent: draft.content,
          courseName: activeDiscipline?.name,
          topicName: activeTopic?.name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message ?? "Falha ao gerar bloco interativo.");
      }

      const result = data.data as {
        title: string;
        html: string;
        explanation: string;
        frame: "phone" | "canvas";
        height: number;
      };

      insertRenderableBlockAtCursor({
        type: "interactive",
        code: result.html.trim(),
        meta: {
          mode: "split",
          width: 100,
          frame: result.frame,
          height: result.height,
          title: result.title.trim() || "Experiencia interativa",
        },
      });
      setInteractiveModalOpen(false);
      onToast("Bloco interativo inserido na nota.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao gerar bloco interativo.";
      setInteractiveError(message);
      onToast(message, "error");
    } finally {
      setInteractiveGenerating(false);
    }
  }

  async function handleGenerateContent() {
    if (!activeDiscipline?.name || !activeTopic?.name) {
      onToast("Selecione disciplina e tópico para gerar conteúdo.", "error");
      return;
    }

    if (!draft.content.trim() && !contentRequest.trim()) {
      onToast("Escreva algo na nota ou descreva o que a IA deve gerar.", "error");
      return;
    }

    setContentGenerating(true);

    try {
      const sourceContent = [
        draft.title.trim() ? `TÍTULO ATUAL: ${draft.title.trim()}` : "",
        draft.content.trim() ? `NOTA ATUAL:\n${draft.content.trim()}` : "",
        contentRequest.trim()
          ? `INSTRUÇÃO EXTRA:\n${contentRequest.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const response = await fetch("/api/ai/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicName: activeTopic.name,
          courseName: activeDiscipline.name,
          sourceContent,
          format: contentFormat,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message ?? "Falha ao gerar conteúdo.");
      }

      const result = data.data as {
        title: string;
        content: string;
        keyConcepts: string[];
      };

      setDraft((current) => {
        const generatedContent = result.content.trim();
        const nextContent =
          contentInsertMode === "replace"
            ? generatedContent
            : [current.content.trimEnd(), generatedContent].filter(Boolean).join("\n\n");

        return {
          ...current,
          title:
            contentInsertMode === "replace" || current.title === "Nova nota"
              ? result.title
              : current.title,
          content: nextContent,
          format: aiFormatToNoteFormat(contentFormat),
          key_concepts: result.keyConcepts,
        };
      });

      setContentModalOpen(false);
      setContentRequest("");
      onToast("Conteúdo gerado e inserido na nota.");
      requestAnimationFrame(() => titleRef.current?.blur());
    } catch (error) {
      onToast(
        error instanceof Error ? error.message : "Erro ao gerar conteúdo.",
        "error",
      );
    } finally {
      setContentGenerating(false);
    }
  }

  async function handleGenerateFlashcards() {
    if (!activeDiscipline?.name || !activeTopic?.name) {
      onToast("Selecione disciplina e tópico para gerar flashcards.", "error");
      return;
    }

    if (!draft.content.trim()) {
      onToast("A nota precisa ter conteúdo para virar flashcards.", "error");
      return;
    }

    setFlashcardsGenerating(true);

    try {
      const response = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicName: activeTopic.name,
          courseName: activeDiscipline.name,
          masteryLevel: masteryLevelFromStatus(draft.status),
          count: flashcardCount,
          sourceContent: [
            draft.content.trim(),
            flashcardRequest.trim()
              ? `INSTRUÇÃO EXTRA:\n${flashcardRequest.trim()}`
              : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message ?? "Falha ao gerar flashcards.");
      }

      const result = data.data as {
        cards: Array<{
          front: string;
          back: string;
          type: "definition" | "theorem" | "procedure" | "example";
          difficulty: 1 | 2 | 3;
        }>;
      };

      await Promise.all(
        result.cards.map((card) =>
          createFlashcard({
            topic_id: draft.topic_id,
            discipline_id: draft.discipline_id,
            front: card.front,
            back: card.back,
            type: card.type,
            difficulty: card.difficulty,
            tags: draft.tags,
            ai_generated: true,
          }),
        ),
      );

      await onRefreshData();
      setFlashcardsModalOpen(false);
      setFlashcardRequest("");
      onToast(`${result.cards.length} flashcards gerados com sucesso.`);
    } catch (error) {
      onToast(
        error instanceof Error ? error.message : "Erro ao gerar flashcards.",
        "error",
      );
    } finally {
      setFlashcardsGenerating(false);
    }
  }

  const saveStatusLabel = saving
    ? "Salvando..."
    : isDirty
      ? "Salvando em instantes"
      : "Tudo salvo";

  return (
    <>
      <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-[28px] border border-border-default/80 bg-bg-surface/80">
          <div className="border-b border-border-default/70 p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-fg-muted">
                  Vault
                </p>
                <h2 className="mt-2 text-xl font-semibold text-fg-primary">Notas</h2>
              </div>
              <button
                onClick={() => void handleCreateNote()}
                type="button"
                className="rounded-2xl border border-border-default bg-bg-primary px-3 py-2 text-xs font-medium text-fg-primary transition-colors hover:bg-bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <FilePlus2 className="h-4 w-4" />
                  Nova
                </span>
              </button>
            </div>

            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar notas..."
              className="w-full rounded-2xl border border-border-default bg-bg-primary px-3 py-2.5 text-sm text-fg-primary outline-none placeholder:text-fg-muted"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {filteredNotes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <BookOpen className="h-10 w-10 text-fg-muted/30" />
                <p className="text-sm text-fg-tertiary">Nenhuma nota encontrada.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotes.map((note) => {
                  const isActive = note.id === activeNoteId;

                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => void safelySwitchNote(note)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                        isActive
                          ? "border-accent-primary/60 bg-accent-primary/8"
                          : "border-border-default/70 bg-bg-primary/70 hover:bg-bg-secondary",
                      )}
                    >
                      <p className="truncate text-sm font-medium text-fg-primary">
                        {note.title}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-fg-secondary">
                        {note.content}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-[32px] border border-border-default/70 bg-bg-surface/50">
          <div className="border-b border-border-default/60 px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.24em] text-fg-muted">
                  Experiência de escrita
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-fg-secondary">
                  <span>{saveStatusLabel}</span>
                  <span className="text-fg-muted">Cmd/Ctrl + S</span>
                  {(activeDiscipline || activeTopic) && (
                    <span className="text-fg-muted">
                      {activeDiscipline?.name ?? "Sem disciplina"}
                      {activeTopic ? ` · ${activeTopic.name}` : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setContentModalOpen(true)}
                  className="rounded-2xl bg-accent-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Gerar conteúdo
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlashcardsModalOpen(true)}
                  className="rounded-2xl border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-fg-primary transition-colors hover:bg-bg-secondary"
                >
                  <span className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Gerar flashcards
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInteractiveError(null);
                    setInteractiveModalOpen(true);
                  }}
                  className="rounded-2xl border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-fg-primary transition-colors hover:bg-bg-secondary"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Gerar interativo
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGraphError(null);
                    setGraphModalOpen(true);
                  }}
                  className="rounded-2xl border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-fg-primary transition-colors hover:bg-bg-secondary"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Gerar gráfico
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetaOpen((current) => !current)}
                  className="rounded-2xl border border-border-default bg-bg-primary px-3 py-2.5 text-sm text-fg-secondary transition-colors hover:bg-bg-secondary hover:text-fg-primary"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    {metaOpen ? "Ocultar detalhes" : "Detalhes"}
                  </span>
                </button>
              </div>
            </div>

            {metaOpen && (
              <div className="mt-5 rounded-3xl border border-border-default/70 bg-bg-primary/70 p-4">
                <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                  <select
                    value={draft.discipline_id}
                    onChange={(event) => updateDraft("discipline_id", event.target.value)}
                    className="rounded-2xl border border-border-default bg-bg-primary px-3 py-2.5 text-sm text-fg-primary outline-none"
                  >
                    {disciplines.map((discipline) => (
                      <option key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={draft.topic_id}
                    onChange={(event) => updateDraft("topic_id", event.target.value)}
                    className="rounded-2xl border border-border-default bg-bg-primary px-3 py-2.5 text-sm text-fg-primary outline-none"
                  >
                    {draftTopics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={draft.format}
                    onChange={(event) => updateDraft("format", event.target.value as NoteFormat)}
                    className="rounded-2xl border border-border-default bg-bg-primary px-3 py-2.5 text-sm text-fg-primary outline-none"
                  >
                    <option value="free">Livre</option>
                    <option value="cornell">Cornell</option>
                    <option value="outline">Outline</option>
                    <option value="concept_map">Mapa Conceitual</option>
                    <option value="summary">Resumo</option>
                  </select>

                  <select
                    value={draft.status}
                    onChange={(event) => updateDraft("status", event.target.value as ContentStatus)}
                    className="rounded-2xl border border-border-default bg-bg-primary px-3 py-2.5 text-sm text-fg-primary outline-none"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="review">Em revisão</option>
                    <option value="done">Pronto</option>
                  </select>
                </div>

                <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    value={draft.tags.join(", ")}
                    onChange={(event) =>
                      updateDraft(
                        "tags",
                        event.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Tags separadas por vírgula"
                    className="rounded-2xl border border-border-default bg-bg-primary px-3 py-2.5 text-sm text-fg-primary outline-none placeholder:text-fg-muted"
                  />

                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    className="rounded-2xl border border-accent-danger/25 px-4 py-2.5 text-sm text-accent-danger transition-colors hover:bg-accent-danger/10"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Excluir nota
                    </span>
                  </button>
                </div>
              </div>
            )}

            {graphError && (
              <div className="mt-4 rounded-2xl border border-accent-danger/30 bg-accent-danger/5 px-3 py-2 text-sm text-accent-danger">
                {graphError}
              </div>
            )}

            {interactiveError && (
              <div className="mt-4 rounded-2xl border border-accent-danger/30 bg-accent-danger/5 px-3 py-2 text-sm text-accent-danger">
                {interactiveError}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14 xl:px-16">
              <input
                ref={titleRef}
                value={draft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                placeholder="Título da nota"
                className="w-full bg-transparent text-4xl font-semibold tracking-tight text-fg-primary outline-none placeholder:text-fg-muted md:text-5xl"
              />

              <div className="space-y-5">
                {editorItems.map((item, index) => (
                  <div key={`${item.type}-${index}`}>
                    {draggedBlockIndex !== null && (
                      <DropZone
                        onDrop={() => moveRenderableBlock(draggedBlockIndex, index)}
                      />
                    )}

                    {item.type === "text" ? (
                      <LiveMarkdownSegment
                        value={item.text}
                        placeholder={
                          editorItems.length === 1
                            ? "Escreva normalmente. Quando um grafico Mermaid ou bloco interativo entrar na nota, ele vira um bloco com Editor, Split e Render."
                            : ""
                        }
                        onChange={(value, selectionStart, selectionEnd) => {
                          syncCursor(index, selectionStart, selectionEnd);
                          updateTextItem(index, value);
                        }}
                        onSelectionChange={(selectionStart, selectionEnd) =>
                          syncCursor(index, selectionStart, selectionEnd)
                        }
                      />
                    ) : item.type === "interactive" ? (
                      <InteractiveNoteBlock
                        code={item.code}
                        title={item.meta.title}
                        mode={item.meta.mode}
                        width={item.meta.width}
                        frame={item.meta.frame}
                        preferredHeight={item.meta.height}
                        dragging={draggedBlockIndex === index}
                        onCodeChange={(code) => updateRenderableItem(index, { code })}
                        onModeChange={(mode) =>
                          updateRenderableItem(index, { meta: { mode } })
                        }
                        onWidthChange={(width) =>
                          updateRenderableItem(index, { meta: { width } })
                        }
                        onFrameChange={(frame) =>
                          updateRenderableItem(index, { meta: { frame } })
                        }
                        onCopy={() => void copyRenderableItem(index)}
                        onDelete={() => removeRenderableItem(index)}
                        onDragStart={() => setDraggedBlockIndex(index)}
                        onDragEnd={() => setDraggedBlockIndex(null)}
                      />
                    ) : (
                      <RenderableNoteBlock
                        code={item.code}
                        mode={item.meta.mode}
                        width={item.meta.width}
                        dragging={draggedBlockIndex === index}
                        onCodeChange={(code) => updateRenderableItem(index, { code })}
                        onModeChange={(mode) =>
                          updateRenderableItem(index, { meta: { mode } })
                        }
                        onWidthChange={(width) =>
                          updateRenderableItem(index, { meta: { width } })
                        }
                        onCopy={() => void copyRenderableItem(index)}
                        onDelete={() => removeRenderableItem(index)}
                        onDragStart={() => setDraggedBlockIndex(index)}
                        onDragEnd={() => setDraggedBlockIndex(null)}
                      />
                    )}
                  </div>
                ))}

                {draggedBlockIndex !== null && (
                    <DropZone
                    onDrop={() => moveRenderableBlock(draggedBlockIndex, editorItems.length)}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {contentModalOpen && (
        <AiActionModal
          eyebrow="IA de Escrita"
          title="Gerar conteúdo para a nota"
          description="Use a IA para expandir, reorganizar ou aprofundar a nota atual sem poluir a interface principal."
          confirmLabel="Gerar conteúdo"
          loading={contentGenerating}
          canSubmit={Boolean(draft.content.trim() || contentRequest.trim())}
          onClose={() => {
            if (contentGenerating) return;
            setContentModalOpen(false);
          }}
          onSubmit={() => void handleGenerateContent()}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
                Formato
              </label>
              <select
                value={contentFormat}
                onChange={(event) =>
                  setContentFormat(event.target.value as ContentGenerationFormat)
                }
                className="w-full rounded-2xl border border-border-default bg-bg-surface px-3 py-2.5 text-sm text-fg-primary outline-none"
              >
                <option value="summary">Resumo</option>
                <option value="outline">Outline</option>
                <option value="cornell">Cornell</option>
                <option value="concept-map">Mapa conceitual</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
                Inserção
              </label>
              <select
                value={contentInsertMode}
                onChange={(event) =>
                  setContentInsertMode(event.target.value as ContentInsertMode)
                }
                className="w-full rounded-2xl border border-border-default bg-bg-surface px-3 py-2.5 text-sm text-fg-primary outline-none"
              >
                <option value="append">Adicionar ao fim</option>
                <option value="replace">Substituir nota</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
              Direção da IA
            </label>
            <textarea
              value={contentRequest}
              onChange={(event) => setContentRequest(event.target.value)}
              rows={8}
              placeholder="Ex.: deixe a explicação mais clara, inclua exemplos, destaque erros comuns e organize o raciocínio em etapas."
              className="w-full rounded-3xl border border-border-default bg-bg-surface px-4 py-3 text-sm leading-7 text-fg-primary outline-none placeholder:text-fg-muted"
            />
          </div>
        </AiActionModal>
      )}

      {flashcardsModalOpen && (
        <AiActionModal
          eyebrow="IA de Revisão"
          title="Gerar flashcards a partir da nota"
          description="A IA transforma o conteúdo atual em cartões de revisão sem trazer mais painéis para a tela de escrita."
          confirmLabel="Gerar flashcards"
          loading={flashcardsGenerating}
          canSubmit={Boolean(draft.content.trim())}
          onClose={() => {
            if (flashcardsGenerating) return;
            setFlashcardsModalOpen(false);
          }}
          onSubmit={() => void handleGenerateFlashcards()}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
                Quantidade
              </label>
              <select
                value={flashcardCount}
                onChange={(event) => setFlashcardCount(Number(event.target.value))}
                className="w-full rounded-2xl border border-border-default bg-bg-surface px-3 py-2.5 text-sm text-fg-primary outline-none"
              >
                <option value={3}>3 cards</option>
                <option value={5}>5 cards</option>
                <option value={8}>8 cards</option>
              </select>
            </div>

            <div className="rounded-2xl border border-border-default bg-bg-surface px-4 py-3 text-sm text-fg-secondary">
              Os cards serão criados já vinculados ao tópico atual da nota.
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
              Foco opcional
            </label>
            <textarea
              value={flashcardRequest}
              onChange={(event) => setFlashcardRequest(event.target.value)}
              rows={6}
              placeholder="Ex.: priorize definições, exemplos curtos e pegadinhas frequentes da prova."
              className="w-full rounded-3xl border border-border-default bg-bg-surface px-4 py-3 text-sm leading-7 text-fg-primary outline-none placeholder:text-fg-muted"
            />
          </div>
        </AiActionModal>
      )}

      {graphModalOpen && (
        <GraphGeneratorModal
          loading={graphGenerating}
          onClose={() => {
            if (graphGenerating) return;
            setGraphModalOpen(false);
          }}
          onGenerate={handleGenerateGraph}
        />
      )}

      {interactiveModalOpen && (
        <InteractiveGeneratorModal
          loading={interactiveGenerating}
          onClose={() => {
            if (interactiveGenerating) return;
            setInteractiveModalOpen(false);
          }}
          onGenerate={handleGenerateInteractive}
        />
      )}
    </>
  );
}

function DropZone({ onDrop }: { onDrop: () => void }) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className="my-3 h-3 rounded-full border border-dashed border-accent-primary/40 bg-accent-primary/5 transition-colors hover:bg-accent-primary/10"
    />
  );
}
