"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Score = { name: string; value: number }
type Issue = { category: string; severity: string; evidence: string; fix: string }
type AuditReport = {
  summary: string
  scores: Score[]
  issues: Issue[]
  prioritized_actions: string[]
}
type AuditResponse = { report: AuditReport }

export default function QuickUXAuditPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AuditResponse | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setData(null)

    if (!url.trim()) {
      setError("Please enter a URL to audit.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setError(payload?.error || "Failed to run audit. Please try again.")
        return
      }
      setData(payload as AuditResponse)
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl w-full p-4 sm:p-6 md:p-8">
      <div className="space-y-6">
        <header className="text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold">Quick UX Audit</h1>
        </header>

        <form onSubmit={onSubmit} className="space-y-3">
          <label htmlFor="url" className="sr-only">
            Website URL
          </label>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              id="url"
              type="url"
              inputMode="url"
              placeholder="https://blendbases.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="md:flex-1"
              aria-invalid={!!error}
              aria-describedby={error ? "audit-error" : undefined}
            />
            <Button type="submit" disabled={loading} className="md:self-start">
              {loading ? "Auditing…" : "Run audit"}
            </Button>
          </div>
          {error ? (
            <p id="audit-error" role="alert" aria-live="assertive" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </form>

        {data ? (
          <section aria-live="polite" className="space-y-6">
            {/* Summary */}
            <div className="rounded-xl border p-4 sm:p-5">
              <h2 className="text-lg font-medium mb-2">Summary</h2>
              <p className="text-sm leading-6 text-muted-foreground">{data.report.summary}</p>
            </div>

            {/* Scores */}
            <div className="rounded-xl border p-4 sm:p-5">
              <h2 className="text-lg font-medium mb-4">Scores</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.report.scores.map((s, i) => (
                  <div key={i} className="rounded-xl border p-3">
                    <div className="text-sm">
                      <span className="font-medium">{s.name}:</span>{" "}
                      <span className="text-muted-foreground">{s.value}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Issues */}
            <div className="rounded-xl border p-4 sm:p-5">
              <h2 className="text-lg font-medium mb-4">Top Issues</h2>
              <div className="grid grid-cols-1 gap-3">
                {data.report.issues.slice(0, 5).map((issue, i) => (
                  <div key={i} className="rounded-xl border p-4 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {issue.category} {" • "} {issue.severity}
                    </div>
                    <div className="font-medium">{issue.evidence}</div>
                    <div className="text-sm text-muted-foreground">
                      {"Fix: "}
                      {issue.fix}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Actions */}
            <div className="rounded-xl border p-4 sm:p-5">
              <h2 className="text-lg font-medium mb-3">Next Actions</h2>
              {data.report.prioritized_actions.length > 0 ? (
                <ol className="list-decimal pl-5 space-y-2">
                  {data.report.prioritized_actions.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No recommended actions.</p>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
