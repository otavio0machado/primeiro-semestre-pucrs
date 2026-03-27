import { NextResponse } from "next/server";
import { generateFlashcards } from "@/lib/ai/services/generate-flashcards";
import { generateNotes } from "@/lib/ai/services/generate-notes";
import { explainTopic } from "@/lib/ai/services/explain-topic";
import { summarizeDocument } from "@/lib/ai/services/summarize-document";
import { getCurriculumDiscipline, getCurriculumTopic } from "@/lib/materials/catalog";
import { getMaterialTags, prependMaterialHeader } from "@/lib/materials/provenance";
import { buildMaterialSourceContent, getMaterialDocument } from "@/lib/materials/server";
import { createFlashcard } from "@/lib/services/flashcards";
import { createNote } from "@/lib/services/notes";
import type { NoteFormat } from "@/lib/supabase";

type MaterialAIAction = "summarize" | "explain" | "notes" | "flashcards";

interface MaterialAIRequest {
  action?: MaterialAIAction;
  documentId?: string;
  topicId?: string;
  format?: "cornell" | "outline" | "concept-map" | "summary";
  count?: number;
  save?: boolean;
  depth?: "brief" | "standard" | "detailed";
}

function noteFormatFromAction(
  format: NonNullable<MaterialAIRequest["format"]>,
): NoteFormat {
  return format === "concept-map" ? "concept_map" : format;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MaterialAIRequest;
    if (!body.action || !body.documentId) {
      return NextResponse.json(
        { error: "action e documentId são obrigatórios" },
        { status: 400 },
      );
    }

    const document = await getMaterialDocument(body.documentId);
    if (!document) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    const discipline = getCurriculumDiscipline(document.disciplineId);
    if (!discipline) {
      return NextResponse.json({ error: "Disciplina não encontrada" }, { status: 404 });
    }

    const selectedTopicId = body.topicId ?? document.topicIds[0];
    const topic = selectedTopicId ? getCurriculumTopic(selectedTopicId) : null;
    const source = await buildMaterialSourceContent(document.id);

    if ((body.action === "explain" || body.action === "notes" || body.action === "flashcards") && !topic) {
      return NextResponse.json(
        { error: "Selecione um tópico compatível com este material" },
        { status: 400 },
      );
    }

    if (topic && !document.topicIds.includes(topic.id)) {
      return NextResponse.json(
        { error: "O tópico selecionado não pertence a este material" },
        { status: 400 },
      );
    }

    if (body.action === "summarize") {
      const response = await summarizeDocument({
        content: source.content,
        courseName: discipline.name,
        depth: body.depth ?? "standard",
        focusTopics: source.topicNames,
      });

      return NextResponse.json({
        action: body.action,
        source: {
          id: document.id,
          filename: document.filename,
          disciplineName: discipline.name,
          topicNames: source.topicNames,
        },
        result: response.data,
        usage: response.usage,
      });
    }

    if (body.action === "explain" && topic) {
      const response = await explainTopic({
        topicName: topic.name,
        courseName: discipline.name,
        masteryLevel: "none",
        focus: `Explique usando como referência principal o material "${document.filename}" e respeitando a linguagem usada nele. Base textual: ${source.content.slice(0, 3000)}`,
      });

      return NextResponse.json({
        action: body.action,
        source: {
          id: document.id,
          filename: document.filename,
          disciplineName: discipline.name,
          topicName: topic.name,
        },
        result: response.data,
        usage: response.usage,
      });
    }

    if (body.action === "notes" && topic) {
      const format = body.format ?? "summary";
      const response = await generateNotes({
        topicName: topic.name,
        courseName: discipline.name,
        sourceContent: source.content,
        format,
      });

      let saved = null;
      let saveError: string | null = null;

      if (body.save) {
        try {
          const note = await createNote({
            topic_id: topic.id,
            discipline_id: document.disciplineId,
            title: response.data.title,
            content: prependMaterialHeader(response.data.content, document),
            format: noteFormatFromAction(format),
            status: "review",
            key_concepts: response.data.keyConcepts,
            linked_topics: [topic.id],
            tags: getMaterialTags(document),
            ai_generated: true,
          });
          saved = { noteId: note.id };
        } catch (error) {
          saveError = error instanceof Error ? error.message : "Erro ao salvar nota";
        }
      }

      return NextResponse.json({
        action: body.action,
        source: {
          id: document.id,
          filename: document.filename,
          disciplineName: discipline.name,
          topicName: topic.name,
        },
        result: response.data,
        usage: response.usage,
        saved,
        saveError,
      });
    }

    if (body.action === "flashcards" && topic) {
      const response = await generateFlashcards({
        topicName: topic.name,
        courseName: discipline.name,
        masteryLevel: "none",
        count: body.count ?? 6,
        sourceContent: source.content,
      });

      let saved = null;
      let saveError: string | null = null;

      if (body.save) {
        try {
          const cards = await Promise.all(
            response.data.cards.map((card) =>
              createFlashcard({
                topic_id: topic.id,
                discipline_id: document.disciplineId,
                front: card.front,
                back: prependMaterialHeader(card.back, document),
                type: card.type,
                difficulty: card.difficulty,
                tags: getMaterialTags(document),
                ai_generated: true,
              }),
            ),
          );

          saved = {
            flashcardIds: cards.map((card) => card.id),
            count: cards.length,
          };
        } catch (error) {
          saveError = error instanceof Error ? error.message : "Erro ao salvar flashcards";
        }
      }

      return NextResponse.json({
        action: body.action,
        source: {
          id: document.id,
          filename: document.filename,
          disciplineName: discipline.name,
          topicName: topic.name,
        },
        result: response.data,
        usage: response.usage,
        saved,
        saveError,
      });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("materials ai route error", error);
    return NextResponse.json(
      { error: "Erro interno ao processar material." },
      { status: 500 },
    );
  }
}
