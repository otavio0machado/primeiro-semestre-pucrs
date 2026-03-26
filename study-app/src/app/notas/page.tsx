"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Note {
  id: string;
  title: string;
  content: string;
  courseId: string;
  courseName: string;
  topicId: string;
  topicName: string;
  createdAt: string;
  tags: string[];
}

const mockNotes: Note[] = [
  {
    id: "n1",
    title: "Regra para limites no infinito com racionalização",
    content: "Quando temos √(x²+ax) - x com x→∞, multiplicar por conjugado. O truque é fatorar x² dentro da raiz...",
    courseId: "calculo-1",
    courseName: "Cálculo I",
    topicId: "calc1-t09",
    topicName: "Limites no infinito",
    createdAt: "2026-03-25",
    tags: ["técnica", "limite"],
  },
  {
    id: "n2",
    title: "Diferença entre ∧ e ∨ em lógica",
    content: "∧ (conjunção) = AND — ambos precisam ser V. ∨ (disjunção) = OR — pelo menos um V. Confusão comum: linguagem natural 'ou' geralmente é inclusivo...",
    courseId: "mat-discreta",
    courseName: "Mat. Discreta",
    topicId: "md-t01",
    topicName: "Lógica proposicional",
    createdAt: "2026-03-24",
    tags: ["conceito", "lógica"],
  },
  {
    id: "n3",
    title: "Erro recorrente: esquecer domínio em composição",
    content: "f∘g(x) = f(g(x)) mas o domínio de f∘g NÃO é simplesmente Dom(g). Precisa que Im(g) ⊆ Dom(f). Já errei isso 3x na lista...",
    courseId: "calculo-1",
    courseName: "Cálculo I",
    topicId: "calc1-t03",
    topicName: "Funções compostas",
    createdAt: "2026-03-23",
    tags: ["erro", "domínio"],
  },
  {
    id: "n4",
    title: "Tabela-verdade: bicondicional vs condicional",
    content: "p↔q é V quando ambos têm mesmo valor (V,V ou F,F). p→q é F APENAS quando p=V e q=F. Bicondicional = condicional nos dois sentidos...",
    courseId: "mat-discreta",
    courseName: "Mat. Discreta",
    topicId: "md-t02",
    topicName: "Tabelas-verdade",
    createdAt: "2026-03-22",
    tags: ["conceito", "tabela-verdade"],
  },
  {
    id: "n5",
    title: "Squeeze theorem — quando usar",
    content: "Quando não consigo calcular lim f(x) diretamente, procurar g(x) ≤ f(x) ≤ h(x) onde lim g = lim h = L. Útil com sen/cos limitados...",
    courseId: "calculo-1",
    courseName: "Cálculo I",
    topicId: "calc1-t07",
    topicName: "Limites — leis",
    createdAt: "2026-03-21",
    tags: ["técnica", "teorema"],
  },
];

type FilterMode = "all" | "calculo-1" | "mat-discreta";

export default function NotasPage() {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");

  const filtered = mockNotes
    .filter((n) => filter === "all" || n.courseId === filter)
    .filter((n) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.includes(q))
      );
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Notas</h1>
        <span className="font-mono text-xs text-fg-tertiary">{filtered.length} nota{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar notas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-fg-secondary placeholder:text-fg-muted outline-none focus:border-accent-primary/50 transition-colors"
        />
        <div className="flex items-center gap-1.5">
          {([
            { value: "all", label: "Todas" },
            { value: "calculo-1", label: "Cálculo I" },
            { value: "mat-discreta", label: "Discreta" },
          ] as const).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-sm border px-2 py-0.5 text-xs transition-colors ${
                filter === f.value
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {filtered.map((note) => (
          <div
            key={note.id}
            className="rounded-md border border-border-default bg-bg-surface p-4 hover:border-border-hover transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-fg-primary">{note.title}</h3>
                <p className="mt-1 text-xs text-fg-tertiary line-clamp-2">{note.content}</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-fg-muted">{note.createdAt}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline">{note.courseName}</Badge>
              <span className="text-[10px] text-fg-muted">·</span>
              <span className="text-xs text-fg-tertiary">{note.topicName}</span>
              <div className="ml-auto flex items-center gap-1">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-fg-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
          <p className="text-sm text-fg-tertiary">Nenhuma nota encontrada.</p>
        </div>
      )}
    </div>
  );
}
