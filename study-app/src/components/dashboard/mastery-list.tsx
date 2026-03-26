import { MasteryDot } from "@/components/ui/mastery-dot";
import { ScoreDisplay } from "@/components/ui/score-display";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { MockTopic } from "@/data/mock";

interface MasteryListProps {
  title: string;
  topics: MockTopic[];
}

export function MasteryList({ title, topics }: MasteryListProps) {
  return (
    <div className="rounded-md border border-border-default bg-bg-surface p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
        {title}
      </h3>
      <div className="space-y-2">
        {topics.map((topic) => (
          <div key={topic.id} className="group flex items-center gap-2">
            <MasteryDot level={topic.mastery} size="sm" />
            <span className="flex-1 truncate text-sm text-fg-secondary group-hover:text-fg-primary transition-colors">
              {topic.name}
            </span>
            <ProgressBar
              value={topic.score * 100}
              variant="thin"
              className="w-16"
            />
            <ScoreDisplay score={topic.score} className="w-8 text-right text-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}
