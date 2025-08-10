"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function ScoreCard({
  title = "Score",
  value = 0,
}: {
  title?: string
  value?: number
}) {
  const clamped = Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0))
  const pct = (clamped / 5) * 100

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-semibold tabular-nums">{clamped.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">/ 5</div>
        </div>
        <Progress value={pct} className="mt-2" />
      </CardContent>
    </Card>
  )
}
