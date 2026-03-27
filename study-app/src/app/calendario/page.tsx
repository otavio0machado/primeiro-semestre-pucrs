"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { getAssessments } from "@/lib/services/assessments";
import { getStudySessions, createStudySession } from "@/lib/services/study-sessions";
import { getDisciplines } from "@/lib/services/disciplines";
import type { Assessment, StudySession, Discipline, SessionKind } from "@/lib/supabase";
import { Plus, X, AlertCircle } from "lucide-react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SESSION_KINDS: SessionKind[] = ["study", "exercise", "review", "simulation", "flashcard"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatMonth(year: number, month: number) {
  return new Date(year, month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getAssessmentType(type: string): { badge: "danger" | "warning" | "success"; label: string } {
  const map = {
    prova: { badge: "danger", label: "Prova" },
    trabalho: { badge: "warning", label: "Trabalho" },
    ps: { badge: "warning", label: "PS" },
    g2: { badge: "danger", label: "G2" },
  } satisfies Record<string, { badge: "danger" | "warning" | "success"; label: string }>;

  const entry = map[type as keyof typeof map];
  return entry ?? { badge: "warning", label: type };
}

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

export default function CalendarioPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Modal form state
  const [formData, setFormData] = useState({
    discipline_id: "",
    kind: "study" as SessionKind,
    duration_min: 60,
    notes: "",
  });

  // Load data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [a, s, d] = await Promise.all([
          getAssessments(),
          getStudySessions(100),
          getDisciplines(),
        ]);
        setAssessments(a);
        setSessions(s);
        setDisciplines(d);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Handle session creation
  const handleCreateSession = async () => {
    if (!formData.discipline_id) {
      setToast("Selecione uma disciplina");
      return;
    }
    try {
      const newSession = await createStudySession({
        discipline_id: formData.discipline_id,
        kind: formData.kind,
        duration_min: formData.duration_min,
        notes: formData.notes || undefined,
      });
      setSessions([newSession, ...sessions]);
      setToast("Sessão criada com sucesso!");
      setShowModal(false);
      setFormData({ discipline_id: "", kind: "study", duration_min: 60, notes: "" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao criar sessão");
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayStr = today.toISOString().split("T")[0];

  // Get events for this month
  const monthAssessments = assessments.filter((a) => {
    const d = new Date(a.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const monthSessions = sessions.filter((s) => {
    const d = new Date(s.created_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const prev = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Calendário</h1>
        <div className="rounded-md border border-accent-danger/30 bg-accent-danger/5 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent-danger mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-accent-danger">Erro ao carregar</p>
            <p className="text-xs text-fg-secondary mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Calendário</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md border border-accent-primary bg-accent-primary/10 px-3 py-1.5 text-xs font-medium text-accent-primary hover:bg-accent-primary/20 transition-colors flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova sessão de estudo
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="rounded-md border border-border-default px-3 py-1 text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">
          ← Anterior
        </button>
        <span className="text-sm font-semibold capitalize text-fg-primary">{formatMonth(year, month)}</span>
        <button onClick={next} className="rounded-md border border-border-default px-3 py-1 text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">
          Próximo →
        </button>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
          <p className="text-sm text-fg-tertiary">Carregando calendário...</p>
        </div>
      ) : (
        <div className="rounded-md border border-border-default bg-bg-surface">
          <div className="grid grid-cols-7 border-b border-border-default">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
              const dayAssessments = day ? monthAssessments.filter((a) => a.date === dateStr) : [];
              const daySessions = day ? monthSessions.filter((s) => new Date(s.created_at).toISOString().split("T")[0] === dateStr) : [];
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r border-border-default p-2 ${
                    !day ? "bg-bg-primary" : "bg-bg-surface"
                  } ${isToday ? "ring-1 ring-inset ring-accent-primary/40" : ""}`}
                >
                  {day && (
                    <>
                      <span className={`font-mono text-xs ${isToday ? "font-bold text-accent-primary" : "text-fg-tertiary"}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayAssessments.map((a) => {
                          const typeInfo = getAssessmentType(a.type);
                          return (
                            <div key={a.id} className="text-[10px]">
                              <Badge variant={typeInfo.badge}>{typeInfo.label}</Badge>
                              <p className="text-[9px] text-fg-secondary mt-0.5 line-clamp-1">{a.name}</p>
                            </div>
                          );
                        })}
                        {daySessions.map((s) => (
                          <div key={s.id} className="text-[10px]">
                            <div className="w-1 h-1 rounded-full bg-accent-primary inline-block mr-1" />
                            <span className="text-fg-tertiary">Estudo</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming events */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">Próximos 7 dias</h3>
        <div className="space-y-2">
          {assessments
            .filter((a) => daysBetween(a.date, todayStr) >= 0 && daysBetween(a.date, todayStr) <= 7)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((a) => {
              const days = daysBetween(a.date, todayStr);
              const typeInfo = getAssessmentType(a.type);
              const disc = disciplines.find(d => d.id === a.discipline_id);
              return (
                <div key={a.id} className="flex items-center justify-between py-2 border-l-2 border-l-accent-danger/30 pl-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant={typeInfo.badge}>{typeInfo.label}</Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-fg-primary">{a.name}</p>
                      <p className="text-xs text-fg-tertiary">{disc?.name}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-fg-muted flex-shrink-0">
                    {days === 0 ? "HOJE" : days === 1 ? "amanhã" : `em ${days}d`}
                  </span>
                </div>
              );
            })}
          {assessments.filter((a) => daysBetween(a.date, todayStr) >= 0 && daysBetween(a.date, todayStr) <= 7).length === 0 && (
            <p className="text-sm text-fg-tertiary text-center py-4">Nenhum evento nos próximos 7 dias</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border-default rounded-md p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-fg-primary">Nova Sessão de Estudo</h2>
              <button onClick={() => setShowModal(false)} className="text-fg-tertiary hover:text-fg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-fg-secondary block mb-1">Disciplina</label>
                <select
                  value={formData.discipline_id}
                  onChange={(e) => setFormData({ ...formData, discipline_id: e.target.value })}
                  className="w-full rounded-md border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary"
                >
                  <option value="">Selecione uma disciplina</option>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-fg-secondary block mb-1">Tipo de Sessão</label>
                <select
                  value={formData.kind}
                  onChange={(e) => setFormData({ ...formData, kind: e.target.value as SessionKind })}
                  className="w-full rounded-md border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary"
                >
                  {SESSION_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-fg-secondary block mb-1">Duração (minutos)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={formData.duration_min}
                  onChange={(e) => setFormData({ ...formData, duration_min: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-fg-secondary block mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-md border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary resize-none"
                  rows={3}
                  placeholder="Opcional..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-md border border-border-default px-3 py-2 text-sm text-fg-secondary hover:text-fg-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSession}
                className="flex-1 rounded-md bg-accent-primary px-3 py-2 text-sm text-bg-primary font-medium hover:bg-accent-primary/90 transition-colors"
              >
                Criar Sessão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-4 bg-bg-secondary border border-border-default text-fg-primary px-4 py-3 rounded-md text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
