import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import * as cheerio from "cheerio"
import type { AuditResult } from "@/lib/types"

// Helper to safely extract JSON object from model output
function extractJson(text: string): any {
  const first = text.indexOf("{")
  const last = text.lastIndexOf("}")
  if (first === -1 || last === -1 || last <= first) throw new Error("Model did not return JSON.")
  const jsonStr = text.slice(first, last + 1)
  return JSON.parse(jsonStr)
}

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string }
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(url)
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol")
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Fetch the target page HTML (server-side)
    const res = await fetch(parsed.toString(), {
      headers: {
        // More "browser-like" UA helps some sites respond with normal HTML
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    }).catch((e) => {
      throw new Error(`Failed to fetch the URL: ${e?.message || "unknown error"}`)
    })

    const finalUrl = res.url || parsed.toString()
    const status = res.status
    const contentType = res.headers.get("content-type") || ""
    const isHTML = contentType.includes("text/html")
    const rawHTML = isHTML ? await res.text() : ""

    // Basic parsing with cheerio
    const $ = cheerio.load(rawHTML || "")
    const title = $("title").first().text().trim()
    const metaDescription = $('meta[name="description"]').attr("content")?.trim() || ""
    const h1Count = $("h1").length
    const h2Count = $("h2").length
    const linkCount = $("a").length
    const buttonCount = $("button").length + $('a[role="button"]').length
    const imagesMissingAlt = $("img").filter((_, el) => !($(el).attr("alt") || "").trim()).length
    const forms = $("form").length
    const robotsMeta = $('meta[name="robots"]').attr("content") || ""
    const hasViewport = $('meta[name="viewport"]').length > 0
    const textContent = $("body").text().replace(/\s+/g, " ").trim()
    const sampleText = textContent.slice(0, 2000)

    const htmlForLLM = rawHTML ? rawHTML.slice(0, 100_000) : "" // cap to keep token size reasonable

    const context = {
      url: parsed.toString(),
      finalUrl,
      status,
      contentType,
      title,
      metaDescription,
      h1Count,
      h2Count,
      linkCount,
      buttonCount,
      imagesMissingAlt,
      forms,
      robotsMeta,
      hasViewport,
      textSample: sampleText,
    }

    // Build the instruction and request strict JSON back
    const system = [
      "You are an expert ux auditor for websites. Using only this info, produce short reports by reviewing website and code.",
      "Rules:",
      "- Score 0-5: clarity, navigation, accessibility, credibility. (be liberal with rating)",
      "- Up to 8 issues: {category, evidence, severity(low|medium|high), fix}.",
      "- 5 prioritized actions (short, actionable).",
      "- SEO Optimized Headline suggestions",
      "- Button CTA suggestions (if any)",
      "",
      "Output must be a single JSON object matching this TypeScript type:",
      "type AuditResult = {",
      "  scores: { clarity: number; navigation: number; accessibility: number; credibility: number };",
      '  issues: { category: string; evidence: string; severity: "low"|"medium"|"high"; fix: string }[];',
      "  actions: string[]; // 5 items",
      "  seo_headlines: string[]; // 3-8 items",
      "  ctas: string[]; // 0-8 items",
      "};",
      "",
      "Keep text concise. Use available context only. If info is missing, infer conservatively.",
    ].join("\n")

    const userPrompt = [
      "Context about the scanned page:",
      JSON.stringify(context, null, 2),
      "",
      "First 100k chars of HTML (may be truncated):",
      "```html",
      htmlForLLM || "[no html received]",
      "```",
      "",
      "Return ONLY the JSON. No explanations.",
    ].join("\n")

    // Call the model using AI SDK
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system,
      prompt: userPrompt,
    })

    let modelJson: AuditResult
    try {
      modelJson = extractJson(text)
    } catch (e) {
      // Fallback minimal result if JSON parse fails
      modelJson = {
        scores: { clarity: 2, navigation: 2, accessibility: 2, credibility: 2 },
        issues: [
          {
            category: "Parsing",
            evidence: "Model returned non-JSON or malformed JSON.",
            severity: "low",
            fix: "Retry the audit or adjust prompt.",
          },
        ],
        actions: ["Retry the audit"],
        seo_headlines: [],
        ctas: [],
        context, // include context to aid debugging on client
      } as unknown as AuditResult
    }
    // Attach context for client display (non-breaking extension to schema)
    ;(modelJson as any).context = context

    return NextResponse.json(modelJson, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}
