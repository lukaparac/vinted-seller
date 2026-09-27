import { confidenceLabel } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function ConfidenceMeter({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  const pct = Math.round(score * 100);
  const tone =
    score >= 0.8 ? "bg-success" : score >= 0.55 ? "bg-accent" : "bg-warning";

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
      title={`Pouzdanost prepoznavanja: ${pct}%`}
    >
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span className={cn("block h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </span>
      <span className="sr-only">Pouzdanost prepoznavanja </span>
      {confidenceLabel(score)} · {pct}%
    </span>
  );
}
