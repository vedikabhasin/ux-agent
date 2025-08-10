export type Issue = {
  category: string
  evidence: string
  severity: "low" | "medium" | "high"
  fix: string
}

export type Scores = {
  clarity: number
  navigation: number
  accessibility: number
  credibility: number
}

export type ScanContext = {
  url: string
  finalUrl?: string
  status?: number
  contentType?: string
  title?: string
  metaDescription?: string
  h1Count?: number
  h2Count?: number
  linkCount?: number
  buttonCount?: number
  imagesMissingAlt?: number
  forms?: number
  robotsMeta?: string
  hasViewport?: boolean
  textSample?: string
}

export type AuditResult = {
  scores: Scores
  issues: Issue[]
  actions: string[]
  seo_headlines: string[]
  ctas: string[]
  context?: ScanContext
}
