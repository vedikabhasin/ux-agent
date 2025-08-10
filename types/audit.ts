export type Severity = "low" | "medium" | "high"

export interface AuditIssue {
  category: string
  evidence: string
  severity: Severity
  fix: string
}

export interface AuditScores {
  clarity: number
  navigation: number
  accessibility: number
  credibility: number
}

export interface AuditReport {
  scores: AuditScores
  issues: AuditIssue[]
  actions: string[]
  headlineSuggestions: string[]
  ctaSuggestions: string[]
}
