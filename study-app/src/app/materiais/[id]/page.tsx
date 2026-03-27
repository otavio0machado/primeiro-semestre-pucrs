import Link from "next/link";
import { notFound } from "next/navigation";
import { getMaterialDocumentView } from "@/lib/materials/server";
import { MaterialActions } from "./material-actions";

const typeLabels: Record<string, string> = {
  plano_ensino: "Plano de ensino",
  material_aula: "Material de aula",
  lista_exercicios: "Lista oficial",
  exemplos_resolvidos: "Exemplos resolvidos",
  livro_texto: "Livro-base",
};

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = getMaterialDocumentView(id);

  if (!document) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Link href="/materiais" className="text-sm text-fg-tertiary hover:text-fg-secondary">
          ← Voltar para materiais
        </Link>

        <div className="rounded-2xl border border-border-default bg-bg-secondary p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-border-default px-2 py-0.5 text-[11px] uppercase tracking-wider text-fg-muted">
                  {typeLabels[document.type]}
                </span>
                <span className="inline-flex rounded-full bg-bg-surface px-2 py-0.5 text-[11px] uppercase tracking-wider text-fg-secondary">
                  {document.disciplineName}
                </span>
                {document.hasExercises && (
                  <span className="inline-flex rounded-full bg-accent-info/10 px-2 py-0.5 text-[11px] uppercase tracking-wider text-accent-info">
                    Fonte oficial de prática
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-fg-primary">
                  {document.filename}
                </h1>
                <p className="mt-2 text-sm leading-6 text-fg-secondary">{document.description}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoCard label="Páginas" value={`${document.pageCount}`} />
                <InfoCard label="Relevância" value={document.relevance} />
                <InfoCard label="Arquivo" value={document.fileAvailable ? "Disponível" : "Metadado"} />
              </div>
            </div>

            <div className="max-w-sm rounded-xl border border-border-default bg-bg-surface p-4">
              <p className="text-xs uppercase tracking-widest text-fg-muted">Uso no produto</p>
              <p className="mt-2 text-sm leading-6 text-fg-secondary">{document.usage}</p>
            </div>
          </div>
        </div>
      </section>

      {document.topicDetails.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-fg-primary">Tópicos cobertos</h2>
          <div className="flex flex-wrap gap-2">
            {document.topicDetails.map((topic) => (
              <span key={topic.id} className="rounded-full bg-bg-secondary px-3 py-1 text-sm text-fg-secondary">
                {topic.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <MaterialActions
        documentId={document.id}
        topicOptions={document.topicDetails.map((topic) => ({ id: topic.id, name: topic.name }))}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg-primary">Prévia extraída do PDF</h2>
            <p className="text-sm text-fg-tertiary">
              Base textual usada para resumo, explicação, notas e flashcards.
            </p>
          </div>
          {document.extract?.truncated && (
            <span className="rounded-full bg-accent-warning/10 px-3 py-1 text-xs text-accent-warning">
              Prévia truncada para caber no contexto da IA
            </span>
          )}
        </div>

        <div className="max-h-[36rem] overflow-auto rounded-2xl border border-border-default bg-bg-surface p-5">
          <pre className="whitespace-pre-wrap text-sm leading-6 text-fg-secondary">
            {document.extract?.preview ?? "Texto extraído indisponível para este documento."}
          </pre>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-widest text-fg-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-fg-primary">{value}</p>
    </div>
  );
}
