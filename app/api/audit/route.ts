import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { normalizeInputToUrl } from "@/lib/validation"

const MAX_HTML_CHARS = 20000

function stripTags(html: string): string {
  try {
    // Remove scripts/styles and tags to get a rough text snapshot
    const noScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
    const text = noScripts
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    return text
  } catch {
    return ""
  }
}

function truncateMiddle(input: string, max: number): string {
  if (input.length <= max) return input
  const half = Math.floor(max / 2)
  return input.slice(0, half) + "\n...[truncated]...\n" + input.slice(-half)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input: string | undefined = body?.input
    if (!input || typeof input !== "string") {
      return NextResponse.json({ ok: false, error: "Missing input." }, { status: 400 })
    }

    const norm = normalizeInputToUrl(input)
    if (!norm.ok) {
      return NextResponse.json({ ok: false, error: norm.error }, { status: 400 })
    }
    const url = norm.url

    // Fetch page HTML
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
    }).catch((e) => {
      throw new Error(`Failed to fetch URL: ${e?.message || "unknown error"}`)
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Unable to fetch ${url} (status ${res.status}).` }, { status: 400 })
    }

    const html = await res.text()
    const htmlSnippet = truncateMiddle(html, MAX_HTML_CHARS)
    const textSnippet = truncateMiddle(stripTags(html), MAX_HTML_CHARS)

    // Build strict JSON-instruction prompt
    const system =
      "You are an expert UX auditor for websites. Review the provided URL and HTML only. Be concise and pragmatic."

    const schemaHint = `
Return ONLY valid JSON matching this schema and nothing else (no code fences):

{
  "scores": { "clarity": number (0-5), "navigation": number (0-5), "accessibility": number (0-5), "credibility": number (0-5) },
  "issues": Array<{ "category": string, "evidence": string, "severity": "low"|"medium"|"high", "fix": string }>, // up to 8
  "actions": string[5], // 5 prioritized, short, actionable
  "headlineSuggestions": string[], // SEO optimized headlines
  "ctaSuggestions": string[] // Button CTA ideas
}

Rules:
- Be liberal with scoring (use decimals allowed).
- Ground issues in evidence from the HTML/text.
- Keep outputs compact and scannable.
- No markdown, no commentary. JSON only.
`.trim()

    const userPrompt = `
URL: ${url}

Short page text sample:
"""${textSnippet}"""

HTML sample:
"""${htmlSnippet}"""

Task:
Using only the information above, produce a short UX audit of the landing page.

- Score 0-5: clarity, navigation, accessibility, credibility (be liberal with rating).
- Up to 8 issues: {category, evidence, severity(low|medium|high), fix}.
- 5 prioritized actions (short, actionable).
- SEO Optimized Headline suggestions.
- Button CTA suggestions (if any).

${schemaHint}
`.trim()

    // Call OpenAI via Vercel AI SDK
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system,
      prompt: userPrompt,
    })

    // Try to parse JSON, stripping common wrappers
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim()

    let data: unknown | null = null
    try {
      data = JSON.parse(cleaned)
    } catch {
      // leave data as null; client will show raw
    }

    return NextResponse.json({
      ok: true,
      data,
      raw: text,
      fetchedUrl: url,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error." }, { status: 500 })
  }
}
