import { Badge } from "@/components/ui/badge";
import type { MockSession } from "@/data/mock";
import { Play } from "lucide-react";

interface ActivityFeedProps {
  sessions: MockSession[];
  todayCount: number;
}

export function ActivityFeed({ sessions, todayCount }: ActivityFeedProps) {
  return (
    <div className="rounded-md border border-border-default bg-bg-surface p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
        Atividade Recente
      </h3>

      {/* Today */}
      <div className="mb-3">
        <p className="text-xs font-medium text-fg-secondary">Hoje</p>
        <div className="mt-1 border-t border-border-subtle" />
        {todayCount === 0 ? (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-fg-tertiary">
              Nenhuma sessão ainda.
            </span>
            <button className="flex items-center gap-1.5 rounded-md bg-accent-primary/10 px-3 py-1.5 text-xs font-medium text-accent-primary transition-colors hover:bg-accent-primary/20">
              <Play size={12} />
              Começar a estudar
            </button>
          </div>
        ) : null}
      </div>

      {/* Yesterday */}
      <div>
        <p className="text-xs font-medium text-fg-secondary">Ontem</p>
        <div className="mt-1 border-t border-border-subtle" />
        <div className="mt-2 space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-start gap-3 py-1">
              <span className="shrink-0 font-mono text-xs text-fg-muted w-10">
                {session.time}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{session.kind}</Badge>
                  <span className="truncate text-sm text-fg-secondary">
                    {session.topicName}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-fg-tertiary">
                    {session.durationMin}min
                  </span>
                </div>
                {session.exercisesAttempted > 0 && (
                  <p className="mt-0.5 text-xs text-fg-tertiary">
                    {session.exercisesCorrect}/{session.exercisesAttempted} corretos
                    ({Math.round((session.exercisesCorrect / session.exercisesAttempted) * 100)}%)
                    {session.errorSummary && ` · ${session.errorSummary}`}
                  </p>
                )}
                {session.note && (
                  <p className="mt-0.5 text-xs italic text-fg-muted">
                    &ldquo;{session.note.slice(0, 60)}...&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
