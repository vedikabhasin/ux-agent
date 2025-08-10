"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Globe, Wand2, AlertCircle, CheckCircle2, Target, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AuditResult } from "@/lib/types"
import ScoreCard from "@/components/score-card"

type FetchState = "idle" | "loading" | "done" | "error"

export default function UXAuditPage() {
  const [url, setUrl] = useState("")
  const [state, setState] = useState<FetchState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AuditResult | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    let parsed: URL | null = null
    try {
      parsed = new URL(url.trim())
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Only http(s) URLs are allowed.")
      }
    } catch {
      setError("Please enter a valid URL, including http:// or https://")
      return
    }

    setState("loading")
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parsed.toString() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to create audit. Please try again.")
      }
      const data = (await res.json()) as AuditResult
      setResult(data)
      setState("done")
    } catch (err: any) {
      setError(err?.message || "Something went wrong.")
      setState("error")
    }
  }

  const hasScores = !!result?.scores

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-neutral-900 text-white">
              <Wand2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="font-semibold tracking-tight">Quick UX Audit</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Beta
          </Badge>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Instant UX insights for any landing page
          </h1>
          <p className="text-muted-foreground">
            Paste a URL and get a concise audit with scores, top issues, and prioritized actions.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <div className="relative">
            <Globe
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="url"
              inputMode="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-9"
              aria-label="Website URL"
              required
            />
          </div>
          <Button type="submit" disabled={state === "loading"}>
            {state === "loading" ? "Auditing…" : "Run UX Audit"}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Unable to complete audit</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {state === "loading" && (
          <div className="mt-8 grid gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Clarity", "Navigation", "Accessibility", "Credibility"].map((label) => (
                <Card key={label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-6 w-20 rounded bg-neutral-200 animate-pulse" />
                    <div className="mt-2 h-2 w-full rounded bg-neutral-200 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-neutral-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-neutral-200 animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-neutral-200 animate-pulse" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {state === "done" && result && (
          <div className="mt-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Audited URL:{" "}
                  <a
                    href={result.context?.finalUrl || result.context?.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    {result.context?.finalUrl || result.context?.url}
                  </a>
                </p>
              </div>
              {result.context?.status && (
                <Badge variant="secondary" className="text-xs">
                  Status {result.context.status}
                </Badge>
              )}
            </div>

            {hasScores && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScoreCard title="Clarity" value={result.scores?.clarity ?? 0} />
                <ScoreCard title="Navigation" value={result.scores?.navigation ?? 0} />
                <ScoreCard title="Accessibility" value={result.scores?.accessibility ?? 0} />
                <ScoreCard title="Credibility" value={result.scores?.credibility ?? 0} />
              </div>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  Top Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {result.issues && result.issues.length > 0 ? (
                  result.issues.map((iss, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{iss.category || "General"}</Badge>
                        <Badge
                          className={cn(
                            "capitalize",
                            iss.severity === "high" && "bg-rose-600 text-white hover:bg-rose-600",
                            iss.severity === "medium" && "bg-amber-500 text-white hover:bg-amber-500",
                            iss.severity === "low" && "bg-neutral-800 text-white hover:bg-neutral-800",
                          )}
                        >
                          {iss.severity || "low"}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{iss.evidence}</p>
                        {iss.fix && <p className="text-muted-foreground mt-1">{iss.fix}</p>}
                      </div>
                      {idx < (result.issues?.length ?? 1) - 1 && <Separator />}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No issues detected.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4 text-neutral-800" aria-hidden="true" />5 Prioritized Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal pl-5 space-y-2">
                    {result.actions?.slice(0, 5).map((act, i) => (
                      <li key={i} className="text-sm">
                        {act}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Rocket className="h-4 w-4 text-neutral-800" aria-hidden="true" />
                    SEO Headline Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.seo_headlines?.map((h, i) => (
                    <div key={i} className="text-sm">
                      {"• "}
                      {h}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Button CTA Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {result.ctas?.map((cta, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {cta}
                  </Badge>
                ))}
                {(!result.ctas || result.ctas.length === 0) && (
                  <p className="text-sm text-muted-foreground">No CTAs suggested.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scan Context (summary)</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Title</p>
                  <p className="font-medium break-words">{result.context?.title || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Meta Description</p>
                  <p className="font-medium">{result.context?.metaDescription || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">H1</p>
                    <p className="font-medium">{result.context?.h1Count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Links</p>
                    <p className="font-medium">{result.context?.linkCount ?? 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Buttons</p>
                    <p className="font-medium">{result.context?.buttonCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Images w/o alt</p>
                    <p className="font-medium">{result.context?.imagesMissingAlt ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <footer className="mt-16 border-t">
        <div className="mx-auto max-w-5xl px-4 py-8 text-xs text-muted-foreground">
          Use responsibly. Audits are generated by AI and may contain inaccuracies. Always verify before making changes.
        </div>
      </footer>
    </main>
  )
}
