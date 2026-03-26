import { MasteryDot } from "@/components/ui/mastery-dot";
import { ScoreDisplay } from "@/components/ui/score-display";
import { Badge } from "@/components/ui/badge";
import type { MockReview } from "@/data/mock";

interface ReviewQueueProps {
  reviews: MockReview[];
}

export function ReviewQueue({ reviews }: ReviewQueueProps) {
  return (
    <div className="rounded-md border border-border-default bg-bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
          Revisões Pendentes
        </h3>
        <span className="text-xs text-fg-tertiary">
          Hoje · {reviews.length} revisões
        </span>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="group flex items-start gap-2 rounded-md p-2 transition-colors hover:bg-bg-secondary"
          >
            <MasteryDot level="developing" size="md" className="mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm text-fg-primary">
                  {review.topicName}
                </span>
                <ScoreDisplay score={review.score} className="text-xs" />
              </div>
              <p className="mt-0.5 text-xs text-fg-tertiary">
                {review.reason} · {review.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full rounded-md border border-border-default bg-bg-tertiary px-3 py-1.5 text-sm text-fg-secondary transition-colors hover:bg-bg-secondary hover:text-fg-primary">
        Iniciar sessão de revisão
      </button>
    </div>
  );
}
