import { ExamCountdown } from "@/components/dashboard/exam-countdown";
import { RecommendedAction } from "@/components/dashboard/recommended-action";
import { MasteryList } from "@/components/dashboard/mastery-list";
import { ReviewQueue } from "@/components/dashboard/review-queue";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { GradeSimulator } from "@/components/dashboard/grade-simulator";
import {
  mockExams,
  mockTopicsCalc,
  mockTopicsMD,
  mockReviews,
  mockSessions,
  mockGaps,
} from "@/data/mock";

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">
          Dashboard
        </h1>
        <span className="font-mono text-sm text-fg-tertiary">{today}</span>
      </div>

      {/* Row 1: Exam Countdowns */}
      <section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {mockExams.map((exam) => (
            <ExamCountdown key={exam.id} exam={exam} />
          ))}
        </div>
      </section>

      {/* Row 2: Recommended Action */}
      <section>
        <RecommendedAction examName="P1 de Cálculo" gaps={mockGaps} />
      </section>

      {/* Row 3: Mastery + Reviews (2 columns) */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <MasteryList title="Cálculo I" topics={mockTopicsCalc} />
          <MasteryList title="Mat. Discreta" topics={mockTopicsMD} />
        </div>
        <ReviewQueue reviews={mockReviews} />
      </section>

      {/* Row 4: Activity Feed */}
      <section>
        <ActivityFeed sessions={mockSessions} todayCount={0} />
      </section>

      {/* Row 5: Grade Simulator */}
      <section className="pb-8">
        <GradeSimulator />
      </section>
    </div>
  );
}
