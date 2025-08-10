"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

type Issue = {
  category: string
  severity: "low" | "medium" | "high"
  evidence: string
  fix: string
}

type Report = {
  summary: string
  scores: Record<string, number>
  issues: Issue[]
  prioritized_actions: string[]
  seo_suggestions: string[]
}

type AuditResponse = {
  report: Report
}

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function severityClasses(level: Issue["severity"]) {
  switch (level) {
    case "high":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    case "medium":
      return "bg-amber-100 text-amber-900 hover:bg-amber-100"
    case "low":
    default:
      return "bg-emerald-100 text-emerald-900 hover:bg-emerald-100"
  }
}

export default function AuditClient({ defaultUrl = "https://blendbases.com" }: { defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AuditResponse | null>(null)

  async function onRunAudit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setData(null)
    setLoading(true)

    // Log the URL on click as requested
    console.log("URL:", url)

    try {
      // Optional basic validation (kept minimal)
      try {
        // eslint-disable-next-line no-new
        new URL(url)
      } catch {
        throw new Error("Please enter a valid URL (e.g., https://example.com).")
      }

      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!res.ok) {
        const message = await res.text().catch(() => "")
        throw new Error(message || "Request failed")
      }

      const json = (await res.json()) as AuditResponse
      setData(json)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Quick UX Audit (Dummy)</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter a URL and run a dummy UX audit. Results are mock data.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Run an Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={onRunAudit}>
            <div className="flex-1">
              <Label htmlFor="audit-url">URL</Label>
              <Input
                id="audit-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                inputMode="url"
                autoComplete="url"
                className="mt-1"
              />
            </div>
            <div className="pt-6 sm:pt-0">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Running..." : "Run audit"}
              </Button>
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4" role="alert" aria-live="assertive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {data && (
        <section aria-live="polite" className="space-y-8">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{data.report.summary}</p>
            </CardContent>
          </Card>

          {/* Scores */}
          <section aria-labelledby="scores-heading" className="space-y-3">
            <h2 id="scores-heading" className="text-xl font-semibold">
              Scores
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(data.report.scores).map(([k, v]) => (
                <Card key={k} className="rounded-lg">
                  <CardContent className="py-5 flex items-center justify-between">
                    <span className="font-medium">{titleCase(k)}</span>
                    <span className="text-2xl font-bold tabular-nums">{v}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Issues (first 5) */}
          <section aria-labelledby="issues-heading" className="space-y-3">
            <h2 id="issues-heading" className="text-xl font-semibold">
              Issues
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {data.report.issues.slice(0, 5).map((issue, idx) => (
                <Card key={`${issue.category}-${idx}`}>
                  <CardContent className="py-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{issue.category}</span>
                      <span aria-hidden="true">•</span>
                      <Badge className={severityClasses(issue.severity)}>{titleCase(issue.severity)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Evidence:</span> {issue.evidence}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Fix:</span> {issue.fix}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Next actions */}
          <section aria-labelledby="actions-heading" className="space-y-3">
            <h2 id="actions-heading" className="text-xl font-semibold">
              Next actions
            </h2>
            <ol className="list-decimal ml-6 space-y-1">
              {data.report.prioritized_actions.map((a, i) => (
                <li key={i} className="text-sm leading-6">
                  {a}
                </li>
              ))}
            </ol>
          </section>

          {/* SEO suggestions */}
          <section aria-labelledby="seo-heading" className="space-y-3">
            <h2 id="seo-heading" className="text-xl font-semibold">
              SEO suggestions
            </h2>
            <ul className="list-disc ml-6 space-y-1">
              {data.report.seo_suggestions.map((s, i) => (
                <li key={i} className="text-sm leading-6">
                  {s}
                </li>
              ))}
            </ul>
          </section>
        </section>
      )}
    </div>
  )
}
