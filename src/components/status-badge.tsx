import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type ItemStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";

const STYLES: Record<ItemStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  ready: "bg-accent/12 text-accent border-accent/30",
  listed: "bg-chart-3/12 text-chart-3 border-chart-3/30",
  reserved: "bg-warning/18 text-warning-foreground border-warning/40",
  sold: "bg-success/12 text-success border-success/30",
  shipped: "bg-primary/8 text-primary border-primary/25",
};

export function StatusBadge({ status }: { status: string }) {
  const key = (STATUS_LABEL[status as ItemStatus] ? status : "draft") as ItemStatus;
  return (
    <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 font-medium", STYLES[key])}>
      {STATUS_LABEL[key]}
    </Badge>
  );
}
