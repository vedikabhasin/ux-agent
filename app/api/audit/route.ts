export const runtime = "nodejs"

type Body = {
  url: string
}

export async function POST(req: Request) {
  // Validate JSON body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null || typeof (body as Partial<Body>).url !== "string") {
    return Response.json({ error: "Invalid body" }, { status: 400 })
  }

  // Ignore the URL and return static dummy JSON exactly as requested
  const report = {
    summary: "Dummy audit: example results for testing UI plumbing.",
    scores: {
      clarity: 7,
      navigation: 6,
      accessibility: 8,
      credibility: 7,
    },
    issues: [
      {
        category: "Navigation",
        evidence: "Top nav has 9 items; duplicates in footer.",
        severity: "medium",
        fix: "Group lesser items under a single 'More' menu.",
      },
      {
        category: "Clarity",
        evidence: "Hero headline is generic.",
        severity: "high",
        fix: "Add a specific value prop and audience.",
      },
      {
        category: "Accessibility",
        evidence: "3 images missing alt.",
        severity: "medium",
        fix: "Add meaningful alt text.",
      },
    ],
    prioritized_actions: [
      "Tighten hero message to one sentence.",
      "Reduce primary nav to 5–6 items.",
      "Add alt text to all images.",
      "Add clear primary CTA above the fold.",
      "Improve meta title/description for key pages.",
    ],
    seo_suggestions: [
      "Meta title 55–60 chars with primary keyword.",
      "Meta description 150–160 chars with CTA.",
      "Use one H1 per page; descriptive slugs.",
    ],
  }

  const evidence = { url: "dummy://test" }

  return Response.json({ report, evidence })
}
