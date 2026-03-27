import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  getCurriculumDiscipline,
  getCurriculumTopic,
  getCurriculumTopics,
} from "@/lib/materials/catalog";
import { createCustomMaterialDocument } from "@/lib/materials/custom";
import type { MaterialDocumentType, MaterialRelevance } from "@/lib/materials/types";

export const runtime = "nodejs";

const VALID_DOCUMENT_TYPES = new Set<MaterialDocumentType>([
  "plano_ensino",
  "material_aula",
  "lista_exercicios",
  "exemplos_resolvidos",
  "livro_texto",
]);
const VALID_RELEVANCE = new Set<MaterialRelevance>(["critical", "high", "medium", "low"]);

function readTextField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBooleanField(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "true" || value === "on" || value === "1";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecione um PDF para enviar." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Apenas arquivos PDF são aceitos." }, { status: 400 });
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "O arquivo excede o limite de 50 MB." },
        { status: 413 },
      );
    }

    const disciplineId = readTextField(formData, "disciplineId");
    const description = readTextField(formData, "description");
    const usage = readTextField(formData, "usage");
    const type = readTextField(formData, "type") as MaterialDocumentType;
    const relevance = readTextField(formData, "relevance") as MaterialRelevance;
    const pageCountValue = readTextField(formData, "pageCount");
    const topicIds = formData
      .getAll("topicIds")
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    if (!disciplineId || !getCurriculumDiscipline(disciplineId)) {
      return NextResponse.json({ error: "Selecione uma disciplina válida." }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json(
        { error: "Adicione uma descrição curta para o material." },
        { status: 400 },
      );
    }

    if (!VALID_DOCUMENT_TYPES.has(type)) {
      return NextResponse.json({ error: "Tipo de material inválido." }, { status: 400 });
    }

    if (!VALID_RELEVANCE.has(relevance)) {
      return NextResponse.json({ error: "Relevância inválida." }, { status: 400 });
    }

    const uniqueTopicIds = [...new Set(topicIds)];
    const disciplineTopicIds = new Set(getCurriculumTopics(disciplineId).map((topic) => topic.id));
    const invalidTopicId = uniqueTopicIds.find((topicId) => !getCurriculumTopic(topicId));

    if (invalidTopicId) {
      return NextResponse.json(
        { error: "Um dos tópicos selecionados não existe." },
        { status: 400 },
      );
    }

    const crossDisciplineTopic = uniqueTopicIds.find((topicId) => !disciplineTopicIds.has(topicId));

    if (crossDisciplineTopic) {
      return NextResponse.json(
        { error: "Os tópicos precisam pertencer à disciplina escolhida." },
        { status: 400 },
      );
    }

    const parsedPageCount = pageCountValue ? Number.parseInt(pageCountValue, 10) : null;
    if (
      pageCountValue &&
      (parsedPageCount === null || !Number.isFinite(parsedPageCount) || parsedPageCount <= 0)
    ) {
      return NextResponse.json(
        { error: "Número de páginas inválido." },
        { status: 400 },
      );
    }

    const document = await createCustomMaterialDocument({
      filename: file.name,
      fileBuffer: Buffer.from(await file.arrayBuffer()),
      disciplineId,
      description,
      usage:
        usage || "Material adicionado manualmente na aba de materiais para consulta e estudo.",
      type,
      relevance,
      topicIds: uniqueTopicIds,
      hasExercises: readBooleanField(formData, "hasExercises"),
      hasSolutions: readBooleanField(formData, "hasSolutions"),
      pageCount: parsedPageCount ?? undefined,
    });

    revalidatePath("/materiais");
    revalidatePath(`/materiais/${document.id}`);

    return NextResponse.json({
      ok: true,
      document: {
        id: document.id,
        filename: document.filename,
      },
    });
  } catch (error) {
    console.error("materials upload route error", error);
    return NextResponse.json(
      { error: "Erro interno ao enviar material." },
      { status: 500 },
    );
  }
}
