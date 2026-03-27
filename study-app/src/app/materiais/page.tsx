import Link from "next/link";
import type { ReactNode } from "react";
import { getCurriculumDisciplines, getCurriculumModules, getCurriculumTopics } from "@/lib/materials/catalog";
import { MATERIAL_TYPE_LABELS, type MaterialDocument } from "@/lib/materials/types";
import {
  groupMaterialDocumentsByDiscipline,
  listCustomMaterialDocuments,
  listExerciseSourceDocuments,
} from "@/lib/materials/server";
import { MaterialUploadPanel } from "./material-upload-panel";

export const dynamic = "force-dynamic";

export default async function MateriaisPage() {
  const disciplines = getCurriculumDisciplines();
  const grouped = await groupMaterialDocumentsByDiscipline();
  const customDocuments = await listCustomMaterialDocuments();
  const officialExerciseSources = (await listExerciseSourceDocuments()).filter(
    (document) =>
      document.source === "seed" &&
      (document.type === "lista_exercicios" || document.type === "exemplos_resolvidos"),
  );
  const topicOptionsByDiscipline = Object.fromEntries(
    disciplines.map((discipline) => [
      discipline.id,
      getCurriculumTopics(discipline.id).map((topic) => ({
        id: topic.id,
        name: topic.name,
      })),
    ]),
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border-default bg-bg-secondary p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fg-muted">
              Materiais Oficiais
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-fg-primary">
              Biblioteca viva do semestre
            </h1>
            <p className="text-sm leading-6 text-fg-secondary">
              Esta área concentra os PDFs reais que definem o conteúdo de Cálculo I e Matemática
              Discreta. Cada material pode virar resumo, explicação, nota estruturada e flashcards
              com fonte explícita.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Disciplinas" value={disciplines.length} />
            <StatCard
              label="Documentos"
              value={grouped.reduce((total, entry) => total + entry.documents.length, 0)}
            />
            <StatCard label="Módulos" value={getCurriculumModules().length} />
            <StatCard label="Tópicos" value={getCurriculumTopics().length} />
          </div>
        </div>
      </section>

      <MaterialUploadPanel
        disciplineOptions={disciplines.map((discipline) => ({
          id: discipline.id,
          name: discipline.name,
        }))}
        topicOptionsByDiscipline={topicOptionsByDiscipline}
      />

      {customDocuments.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-fg-primary">Materiais adicionados no app</h2>
              <p className="text-sm text-fg-tertiary">
                PDFs enviados diretamente por você e já disponíveis para consulta.
              </p>
            </div>
            <p className="text-sm text-fg-muted">{customDocuments.length} material(is) personalizado(s)</p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {customDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                href={`/materiais/${document.id}`}
                badges={[
                  <span
                    key="source"
                    className="rounded-full bg-accent-primary/10 px-2 py-1 text-xs text-accent-primary"
                  >
                    Adicionado no app
                  </span>,
                  ...(document.hasExercises
                    ? [
                        <span
                          key="exercises"
                          className="rounded-full bg-accent-info/10 px-2 py-1 text-xs text-accent-info"
                        >
                          Tem exercícios
                        </span>,
                      ]
                    : []),
                ]}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-fg-primary">Banco oficial de prática</h2>
            <p className="text-sm text-fg-tertiary">
              Fontes prioritárias para exercícios e resolução guiada.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {officialExerciseSources.map((document) => (
            <DocumentCard key={document.id} document={document} href={`/materiais/${document.id}`} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        {grouped.map(({ discipline, documents }) => {
          const moduleCount = getCurriculumModules(discipline.id).length;
          const topicCount = getCurriculumTopics(discipline.id).length;

          return (
            <div key={discipline.id} className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-fg-primary">{discipline.name}</h2>
                  <p className="text-sm text-fg-tertiary">
                    {discipline.professor} · {moduleCount} módulos · {topicCount} tópicos
                  </p>
                </div>
                <Link
                  href={`/disciplina/${discipline.id}`}
                  className="text-sm text-accent-primary hover:underline"
                >
                  Abrir disciplina →
                </Link>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {documents.map((document) => {
                  const topicBadges = document.topicIds
                    .slice(0, 4)
                    .map((topicId) => {
                      const topic = getCurriculumTopics(discipline.id).find((entry) => entry.id === topicId);
                      if (!topic) {
                        return null;
                      }

                      return (
                        <span
                          key={topic.id}
                          className="rounded-full bg-bg-secondary px-2 py-1 text-xs text-fg-secondary"
                        >
                          {topic.name}
                        </span>
                      );
                    })
                    .filter(Boolean);

                  return (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      href={`/materiais/${document.id}`}
                      badges={[
                        ...(document.source === "custom"
                          ? [
                              <span
                                key="source"
                                className="rounded-full bg-accent-primary/10 px-2 py-1 text-xs text-accent-primary"
                              >
                                Adicionado no app
                              </span>,
                            ]
                          : []),
                        ...(document.hasExercises
                          ? [
                              <span
                                key="hasExercises"
                                className="rounded-full bg-accent-info/10 px-2 py-1 text-xs text-accent-info"
                              >
                                Exercícios oficiais
                              </span>,
                            ]
                          : []),
                        ...(document.hasSolutions
                          ? [
                              <span
                                key="hasSolutions"
                                className="rounded-full bg-accent-success/10 px-2 py-1 text-xs text-accent-success"
                              >
                                Tem resolução
                              </span>,
                            ]
                          : []),
                        ...(!document.topicIds.length
                          ? [
                              <span
                                key="general"
                                className="rounded-full bg-bg-tertiary px-2 py-1 text-xs text-fg-muted"
                              >
                                Documento estruturante da disciplina
                              </span>,
                            ]
                          : []),
                        ...topicBadges,
                        ...(document.topicIds.length > 4
                          ? [
                              <span
                                key="topics-more"
                                className="rounded-full bg-bg-secondary px-2 py-1 text-xs text-fg-muted"
                              >
                                +{document.topicIds.length - 4} tópicos
                              </span>,
                            ]
                          : []),
                      ]}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function DocumentCard({
  document,
  href,
  badges = [],
}: {
  document: MaterialDocument;
  href: string;
  badges?: ReactNode[];
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border-default bg-bg-surface p-5 transition-colors hover:border-accent-primary hover:bg-bg-tertiary"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0 space-y-2">
            <span className="inline-flex rounded-full border border-border-default px-2 py-0.5 text-[11px] uppercase tracking-wider text-fg-muted">
              {MATERIAL_TYPE_LABELS[document.type]}
            </span>
            <h3 className="text-lg font-medium text-fg-primary [overflow-wrap:anywhere]">
              {document.filename}
            </h3>
            <p className="text-sm leading-6 text-fg-secondary [overflow-wrap:anywhere]">
              {document.description}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-1 text-left text-xs text-fg-muted md:items-end md:text-right">
            {document.pageCount > 0 ? <p>{document.pageCount} págs.</p> : <p>Páginas a confirmar</p>}
            <p>{document.source === "custom" ? "Material pessoal" : document.relevance}</p>
          </div>
        </div>

        {badges.length > 0 && <div className="flex flex-wrap gap-2">{badges}</div>}
      </div>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl border border-border-default bg-bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-widest text-fg-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-fg-primary">{value}</p>
    </div>
  );
}
