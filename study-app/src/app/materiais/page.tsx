import Link from "next/link";
import {
  getCurriculumDisciplines,
  getCurriculumModules,
  getCurriculumTopics,
  getExerciseSourceDocuments,
  groupDocumentsByDiscipline,
} from "@/lib/materials/catalog";

const typeLabels: Record<string, string> = {
  plano_ensino: "Plano de ensino",
  material_aula: "Material de aula",
  lista_exercicios: "Lista oficial",
  exemplos_resolvidos: "Exemplos resolvidos",
  livro_texto: "Livro-base",
};

export default function MateriaisPage() {
  const disciplines = getCurriculumDisciplines();
  const grouped = groupDocumentsByDiscipline();
  const officialExerciseSources = getExerciseSourceDocuments().filter(
    (document) =>
      document.type === "lista_exercicios" || document.type === "exemplos_resolvidos",
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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg-primary">Banco oficial de prática</h2>
            <p className="text-sm text-fg-tertiary">
              Fontes prioritárias para exercícios e resolução guiada.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {officialExerciseSources.map((document) => (
            <Link
              key={document.id}
              href={`/materiais/${document.id}`}
              className="rounded-xl border border-border-default bg-bg-surface p-4 transition-colors hover:border-accent-primary hover:bg-bg-tertiary"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <span className="inline-flex rounded-full border border-border-default px-2 py-0.5 text-[11px] uppercase tracking-wider text-fg-muted">
                    {typeLabels[document.type]}
                  </span>
                  <h3 className="font-medium text-fg-primary">{document.filename}</h3>
                  <p className="text-sm text-fg-secondary">{document.description}</p>
                </div>
                <div className="text-right text-xs text-fg-muted">
                  <p>{document.pageCount} págs.</p>
                  <p>{document.hasSolutions ? "Com gabarito" : "Sem gabarito"}</p>
                </div>
              </div>
            </Link>
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
                {documents.map((document) => (
                  <Link
                    key={document.id}
                    href={`/materiais/${document.id}`}
                    className="rounded-2xl border border-border-default bg-bg-surface p-5 transition-colors hover:border-accent-primary hover:bg-bg-tertiary"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <span className="inline-flex rounded-full border border-border-default px-2 py-0.5 text-[11px] uppercase tracking-wider text-fg-muted">
                            {typeLabels[document.type]}
                          </span>
                          <h3 className="text-lg font-medium text-fg-primary">{document.filename}</h3>
                        </div>

                        <div className="text-right text-xs text-fg-muted">
                          <p>{document.pageCount} págs.</p>
                          <p>{document.relevance}</p>
                        </div>
                      </div>

                      <p className="text-sm leading-6 text-fg-secondary">{document.description}</p>

                      <div className="flex flex-wrap gap-2">
                        {document.hasExercises && (
                          <span className="rounded-full bg-accent-info/10 px-2 py-1 text-xs text-accent-info">
                            Exercícios oficiais
                          </span>
                        )}
                        {document.hasSolutions && (
                          <span className="rounded-full bg-accent-success/10 px-2 py-1 text-xs text-accent-success">
                            Tem resolução
                          </span>
                        )}
                        {!document.topicIds.length && (
                          <span className="rounded-full bg-bg-tertiary px-2 py-1 text-xs text-fg-muted">
                            Documento estruturante da disciplina
                          </span>
                        )}
                      </div>

                      {document.topicIds.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {document.topicIds.slice(0, 4).map((topicId) => {
                            const topic = getCurriculumTopics(discipline.id).find((entry) => entry.id === topicId);
                            if (!topic) return null;
                            return (
                              <span
                                key={topic.id}
                                className="rounded-full bg-bg-secondary px-2 py-1 text-xs text-fg-secondary"
                              >
                                {topic.name}
                              </span>
                            );
                          })}
                          {document.topicIds.length > 4 && (
                            <span className="rounded-full bg-bg-secondary px-2 py-1 text-xs text-fg-muted">
                              +{document.topicIds.length - 4} tópicos
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-widest text-fg-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-fg-primary">{value}</p>
    </div>
  );
}
