"use client";

import type { CategoryDistribution } from "@/lib/error-diagnosis";

interface Props {
  data: CategoryDistribution[];
}

export function CategoryChart({ data }: Props) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="rounded-md border border-border-default bg-bg-surface p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
        Distribuição por Categoria
      </h3>
      <div className="space-y-2.5">
        {data.map((item) => (
          <div key={item.category} className="flex items-center gap-3">
            <span className="w-24 text-right text-xs text-fg-secondary">{item.label}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="h-5 flex-1 rounded-sm bg-bg-tertiary">
                  <div
                    className={`h-full rounded-sm ${item.color} transition-all`}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 font-mono text-xs font-semibold text-fg-primary">{item.count}</span>
                <span className="w-10 text-right font-mono text-[10px] text-fg-muted">{item.percentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
