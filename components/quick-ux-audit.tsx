"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Clipboard, ExternalLink, Globe, Loader2, RefreshCw, TriangleAlert, Wand2 } from "lucide-react"
import { normalizeInputToUrl, isAcceptableInput } from "@/lib/validation"
import type { AuditReport } from "@/types/audit"
import SeverityBadge from "./severity-badge"
import ScoreMeter from "./score-meter"

type ApiSuccess = {
  ok: true
  data?: AuditReport
  raw: string
  fetchedUrl: string
}
type ApiError = {
  ok: false
  error: string
}

export default function QuickUXAudit() {
  const [input, setInput] = useState("example.com")
  const [isValid, setIsValid] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [raw, setRaw] = useState<string | null>(null)
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const onChange = useCallback((v: string) => {
    setInput(v)
    setIsValid(v.trim().length === 0 || isAcceptableInput(v))
  }, [])

  const normalized = useMemo(() => {
    const r = normalizeInputToUrl(input)
    return r.ok ? r.url : null
  }, [input])

  const doAudit = useCallback(async () => {
    setError(null)
    setReport(null)
    setRaw(null)
    setFetchedUrl(null)
    setCopied(false)

    if (!isAcceptableInput(input)) {
      setIsValid(false)
      setError("Please enter a valid .com domain (e.g., example.com) or a full URL (https://example.com).")
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })
      const json: ApiSuccess | ApiError = await res.json()
      if (!json.ok) {
        throw new Error((json as ApiError).error || "Audit failed")
      }
      const success = json as ApiSuccess
      setFetchedUrl(success.fetchedUrl)
      setRaw(success.raw)
      if (success.data) {
        setReport(success.data)
      } else {
        setError("Received unstructured response. Showing raw output below.")
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong while running the audit.")
    } finally {
      setIsLoading(false)
    }
  }, [input])

  const copyReport = useCallback(async () => {
    try {
      const payload = report ? JSON.stringify(report, null, 2) : raw || ""
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }, [report, raw])

  return (
    <div className="space-y-6">
      <Card className="border-neutral-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Analyze a landing page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden />
              <Input
                value={input}
                onChange={(e) => onChange(e.target.value)}
                placeholder="example.com or https://example.com"
                className={`pl-9 ${!isValid ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                aria-invalid={!isValid}
                aria-describedby="input-help"
              />
            </div>
            <Button
              onClick={doAudit}
              disabled={isLoading || !isAcceptableInput(input)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Auditing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" /> Run Audit
                </>
              )}
            </Button>
          </div>
          <p id="input-help" className="text-xs text-neutral-500">
            Only .com domains or full URLs are accepted. Bare domains are normalized to https.
          </p>
          {!isValid && <div className="text-xs text-red-600">Please enter a valid .com domain or full URL.</div>}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="border-red-300">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Audit failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(report || raw) && (
        <Card className="border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">Audit Results</CardTitle>
              {fetchedUrl && (
                <a
                  href={fetchedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {fetchedUrl}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyReport}
                className="border-neutral-300 bg-transparent"
                title="Copy JSON"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReport(null)
                  setRaw(null)
                  setError(null)
                }}
                className="border-neutral-300"
                title="Clear"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {report ? (
              <>
                <section>
                  <h2 className="font-semibold text-base mb-3">Scores</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ScoreMeter label="Clarity" value={report.scores.clarity} />
                    <ScoreMeter label="Navigation" value={report.scores.navigation} />
                    <ScoreMeter label="Accessibility" value={report.scores.accessibility} />
                    <ScoreMeter label="Credibility" value={report.scores.credibility} />
                  </div>
                </section>

                <Separator />

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-base">Issues</h2>
                    <Badge variant="outline" className="text-neutral-600 border-neutral-300">
                      {report.issues.length} found
                    </Badge>
                  </div>
                  {report.issues.length === 0 ? (
                    <p className="text-sm text-neutral-600">No issues reported.</p>
                  ) : (
                    <div className="space-y-3">
                      {report.issues.map((issue, idx) => (
                        <div key={idx} className="rounded-md border border-neutral-200 p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <SeverityBadge severity={issue.severity} />
                            <span className="text-sm font-medium">{issue.category}</span>
                          </div>
                          <p className="text-sm text-neutral-700">
                            <span className="font-medium">Evidence: </span>
                            {issue.evidence}
                          </p>
                          <p className="text-sm text-neutral-700 mt-1">
                            <span className="font-medium">Fix: </span>
                            {issue.fix}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <Separator />

                <section>
                  <h2 className="font-semibold text-base mb-3">Top Actions</h2>
                  {report.actions.length === 0 ? (
                    <p className="text-sm text-neutral-600">No actions provided.</p>
                  ) : (
                    <ol className="list-decimal pl-5 space-y-1.5">
                      {report.actions.map((a, i) => (
                        <li key={i} className="text-sm text-neutral-800">
                          {a}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

                <Separator />

                <section className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h2 className="font-semibold text-base mb-3">SEO Headline Suggestions</h2>
                    {report.headlineSuggestions.length === 0 ? (
                      <p className="text-sm text-neutral-600">No suggestions provided.</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1.5">
                        {report.headlineSuggestions.map((h, i) => (
                          <li key={i} className="text-sm text-neutral-800">
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-base mb-3">Button CTA Suggestions</h2>
                    {report.ctaSuggestions.length === 0 ? (
                      <p className="text-sm text-neutral-600">No suggestions provided.</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1.5">
                        {report.ctaSuggestions.map((c, i) => (
                          <li key={i} className="text-sm text-neutral-800">
                            {c}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <section>
                <h2 className="font-semibold text-base mb-3">Raw Output</h2>
                <ScrollArea className="h-72 rounded-md border border-neutral-200 p-3">
                  <pre className="text-xs whitespace-pre-wrap">{raw}</pre>
                </ScrollArea>
              </section>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
