import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const url = typeof body?.url === "string" ? body.url : ""

    if (!url) {
      return NextResponse.json({ error: "Missing 'url' in request body" }, { status: 400 })
    }

    try {
      // Basic validation
      // eslint-disable-next-line no-new
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Dummy report data
    const report = {
      summary: `We performed a quick, dummy UX audit for ${url}. The findings below are mock data intended to demonstrate layout and flow.`,
      scores: {
        usability: 82,
        accessibility: 76,
        performance: 88,
        content: 70,
        trust: 65,
        seo: 80,
      },
      issues: [
        {
          category: "Accessibility",
          severity: "high",
          evidence: "Insufficient color contrast between text and background on primary buttons.",
          fix: "Increase contrast to meet WCAG AA (contrast ratio >= 4.5:1) or adjust color tokens.",
        },
        {
          category: "Navigation",
          severity: "medium",
          evidence: "Mobile menu requires two taps to close after navigation.",
          fix: "Close the menu automatically on route change and ensure focus is restored.",
        },
        {
          category: "Content",
          severity: "low",
          evidence: "Some pages exceed recommended line length, reducing readability.",
          fix: "Constrain line length to 60–80 characters using container widths or max-w classes.",
        },
        {
          category: "Forms",
          severity: "medium",
          evidence: "Form fields lack explicit labels; placeholders are used as labels.",
          fix: "Add <label> elements associated via htmlFor and inputs with unique ids.",
        },
        {
          category: "Performance",
          severity: "high",
          evidence: "Large hero image not optimized; no width/height attributes set.",
          fix: "Serve appropriately sized images and include explicit dimensions to avoid layout shift.",
        },
        {
          category: "SEO",
          severity: "low",
          evidence: "Multiple pages missing meta description.",
          fix: "Provide concise, unique meta descriptions per page (140–160 characters).",
        },
        {
          category: "Trust",
          severity: "medium",
          evidence: "No visible privacy policy link in footer.",
          fix: "Add a footer link to privacy policy and terms; surface trust badges where relevant.",
        },
      ],
      prioritized_actions: [
        "Fix high-contrast issues on primary actions to meet WCAG AA.",
        "Optimize hero and large imagery with proper sizing and compression.",
        "Add explicit labels to all form fields and ensure accessible names.",
        "Auto-close mobile nav on route change and manage focus correctly.",
        "Add unique meta descriptions and improve headings hierarchy.",
      ],
      seo_suggestions: [
        "Ensure a single H1 per page and logical heading structure.",
        "Add descriptive alt text to all meaningful images.",
        "Provide unique, keyword-focused meta titles and descriptions.",
        "Generate an XML sitemap and ensure it’s referenced in robots.txt.",
        "Use structured data where applicable (e.g., BreadcrumbList).",
      ],
    }

    return NextResponse.json({ report })
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
