"use client";

import { useMemo, useState } from "react";

interface TopicOption {
  id: string;
  name: string;
}

interface MaterialActionResult {
  action: "summarize" | "explain" | "notes" | "flashcards";
  result: unknown;
  saveError?: string | null;
  saved?: {
    noteId?: string;
    flashcardIds?: string[];
    count?: number;
  } | null;
}

export function MaterialActions({
  documentId,
  topicOptions,
}: {
  documentId: string;
  topicOptions: TopicOption[];
}) {
  const [topicId, setTopicId] = useState(topicOptions[0]?.id ?? "");
  const [format, setFormat] = useState<"summary" | "cornell" | "outline" | "concept-map">("summary");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MaterialActionResult | null>(null);

  const hasTopics = topicOptions.length > 0;

  const canSave = useMemo(
    () => result?.action === "notes" || result?.action === "flashcards",
    [result],
  );

  async function runAction(
    action: "summarize" | "explain" | "notes" | "flashcards",
    save = false,
  ) {
    setLoadingAction(`${action}:${save ? "save" : "run"}`);
    setError(null);

    try {
      const response = await fetch("/api/materials/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          documentId,
          topicId: topicId || undefined,
          format,
          save,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao processar material");
      }

      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro desconhecido");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border-default bg-bg-surface p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-fg-primary">Transformar este material</h2>
        <p className="text-sm text-fg-tertiary">
          Gere conteúdo estudável a partir do documento e, se quiser, salve direto na sua base.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-fg-muted">
            Tópico-alvo
          </label>
          <select
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
            disabled={!hasTopics}
            className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-fg-primary outline-none"
          >
            {!hasTopics && <option value="">Material geral da disciplina</option>}
            {topicOptions.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-fg-muted">
            Formato da nota
          </label>
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as typeof format)}
            className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-fg-primary outline-none"
          >
            <option value="summary">Resumo</option>
            <option value="cornell">Cornell</option>
            <option value="outline">Outline</option>
            <option value="concept-map">Mapa conceitual</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ActionButton
          label="Resumir"
          busy={loadingAction === "summarize:run"}
          onClick={() => runAction("summarize")}
        />
        <ActionButton
          label="Explicar"
          busy={loadingAction === "explain:run"}
          disabled={!hasTopics}
          onClick={() => runAction("explain")}
        />
        <ActionButton
          label="Gerar nota"
          busy={loadingAction === "notes:run"}
          disabled={!hasTopics}
          onClick={() => runAction("notes")}
        />
        <ActionButton
          label="Gerar flashcards"
          busy={loadingAction === "flashcards:run"}
          disabled={!hasTopics}
          onClick={() => runAction("flashcards")}
        />
      </div>

      {result && canSave && (
        <div className="rounded-xl border border-accent-primary/30 bg-accent-primary/5 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-fg-primary">
                Resultado pronto para salvar no histórico real
              </p>
              <p className="text-xs text-fg-tertiary">
                A proveniência será salva com tags do material oficial.
              </p>
            </div>
            <button
              onClick={() => runAction(result.action, true)}
              disabled={loadingAction === `${result.action}:save`}
              className="rounded-md bg-accent-primary px-3 py-2 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loadingAction === `${result.action}:save` ? "Salvando..." : "Salvar na plataforma"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-accent-danger/30 bg-accent-danger/5 p-3 text-sm text-accent-danger">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border border-border-default bg-bg-secondary p-4">
          {"saved" in result && result.saved && (
            <div className="rounded-lg bg-accent-success/10 px-3 py-2 text-sm text-accent-success">
              {result.action === "notes"
                ? "Nota salva com proveniência do material oficial."
                : `${result.saved.count ?? result.saved.flashcardIds?.length ?? 0} flashcards salvos com proveniência.`}
            </div>
          )}

          {result.saveError && (
            <div className="rounded-lg bg-accent-warning/10 px-3 py-2 text-sm text-accent-warning">
              Conteúdo gerado, mas não foi possível salvar: {result.saveError}
            </div>
          )}

          <RenderResult result={result} />
        </div>
      )}
    </section>
  );
}

function ActionButton({
  label,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-sm font-medium text-fg-primary transition-colors hover:border-accent-primary hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? "Processando..." : label}
    </button>
  );
}

function RenderResult({ result }: { result: MaterialActionResult }) {
  if (result.action === "summarize") {
    const data = result.result as {
      summary: string;
      topicsFound: string[];
      definitions: { term: string; definition: string }[];
      keyResults: string[];
    };

    return (
      <div className="space-y-4">
        <Section title="Resumo" content={data.summary} />
        {data.topicsFound?.length > 0 && <TagSection title="Tópicos encontrados" items={data.topicsFound} />}
        {data.definitions?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-fg-primary">Definições</h3>
            <div className="space-y-2">
              {data.definitions.map((definition) => (
                <div key={definition.term} className="rounded-lg border border-border-default bg-bg-primary p-3">
                  <p className="text-sm font-medium text-fg-primary">{definition.term}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-fg-secondary">
                    {definition.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.keyResults?.length > 0 && <TagSection title="Resultados-chave" items={data.keyResults} />}
      </div>
    );
  }

  if (result.action === "explain") {
    const data = result.result as {
      explanation: string;
      analogies: string[];
      prerequisitesMentioned: string[];
      nextTopics: string[];
    };

    return (
      <div className="space-y-4">
        <Section title="Explicação" content={data.explanation} />
        {data.analogies?.length > 0 && <TagSection title="Analogias usadas" items={data.analogies} />}
        {data.prerequisitesMentioned?.length > 0 && (
          <TagSection title="Pré-requisitos mencionados" items={data.prerequisitesMentioned} />
        )}
        {data.nextTopics?.length > 0 && <TagSection title="Próximos tópicos" items={data.nextTopics} />}
      </div>
    );
  }

  if (result.action === "notes") {
    const data = result.result as {
      title: string;
      content: string;
      keyConcepts: string[];
    };

    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-fg-muted">Título sugerido</p>
          <h3 className="mt-1 text-xl font-semibold text-fg-primary">{data.title}</h3>
        </div>
        <Section title="Conteúdo" content={data.content} />
        {data.keyConcepts?.length > 0 && <TagSection title="Conceitos-chave" items={data.keyConcepts} />}
      </div>
    );
  }

  const data = result.result as {
    cards: { front: string; back: string; type: string; difficulty: number }[];
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-fg-primary">Flashcards gerados</h3>
      <div className="grid gap-3 lg:grid-cols-2">
        {data.cards.map((card, index) => (
          <div key={`${card.front}-${index}`} className="rounded-lg border border-border-default bg-bg-primary p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-fg-muted">
              <span>{card.type}</span>
              <span>Dificuldade {card.difficulty}</span>
            </div>
            <p className="text-sm font-medium text-fg-primary">{card.front}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-fg-secondary">{card.back}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-fg-primary">{title}</h3>
      <div className="rounded-lg border border-border-default bg-bg-primary p-4">
        <p className="whitespace-pre-wrap text-sm leading-6 text-fg-secondary">{content}</p>
      </div>
    </div>
  );
}

function TagSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-fg-primary">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-bg-primary px-3 py-1 text-sm text-fg-secondary">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
