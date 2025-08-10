import { Progress } from "@/components/ui/progress"

export default function ScoreMeter({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0))
  const percent = (clamped / 5) * 100
  return (
    <div className="rounded-md border border-neutral-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-neutral-600">{clamped.toFixed(1)} / 5</span>
      </div>
      <Progress value={percent} className="h-2 [&>div]:bg-emerald-600" aria-label={`${label} score`} />
    </div>
  )
}
