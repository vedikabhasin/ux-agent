import { Badge } from "@/components/ui/badge"

export default function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const styles =
    severity === "high"
      ? "bg-red-600 text-white"
      : severity === "medium"
        ? "bg-amber-500 text-white"
        : "bg-emerald-600 text-white"
  return (
    <Badge className={styles} aria-label={`Severity ${severity}`}>
      {severity}
    </Badge>
  )
}
