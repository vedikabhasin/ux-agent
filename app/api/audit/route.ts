export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { z } from 'zod';

const BodySchema = z.object({ url: z.string().url() });

export async function POST(req: NextRequest) {
  try {
    const { url } = BodySchema.parse(await req.json());

    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'UXAuditBot/1.0 (+your-site)' },
    });
    if (!res.ok) {
      return Response.json({ error: `Fetch failed: ${res.status}` }, { status: 400 });
    }
    const html = await res.text();

    const $ = cheerio.load(html);
    const title = $('title').first().text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const h1s = $('h1').map((_, el) => $(el).text().trim()).get();

    const evidence = {
      url,
      title,
      metaDesc,
      h1s: h1s.slice(0, 3),
      titleLength: title.length,
      hasMetaDescription: metaDesc.length > 0,
      h1Count: h1s.length,
      linkCount: $('a[href]').length,
      navLinkCount: $('nav a[href]').length || $('header a[href]').length,
      imageCount: $('img').length,
      imagesMissingAlt: $('img:not([alt]), img[alt=""]').length,
      ctaCount: $('button, a[role="button"]').length,
    };

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `You are a UX auditor. Using ONLY this evidence, produce a short JSON report.
Evidence: ${JSON.stringify(evidence).slice(0, 12000)}
Rules:
- Score 0-10: clarity, navigation, accessibility, credibility.
- Up to 8 issues: {category, evidence, severity(low|medium|high), fix}.
- 5 prioritized actions (short, actionable).
Return strictly valid JSON: {
  "summary": string,
  "scores": { "clarity": number, "navigation": number, "accessibility": number, "credibility": number },
  "issues": [{ "category": string, "evidence": string, "severity": "low"|"medium"|"high", "fix": string }],
  "prioritized_actions": string[]
}`;
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });
    const report = JSON.parse(completion.choices[0].message.content || '{}');

    return Response.json({ report, evidence });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Unknown error' }, { status: 400 });
  }
}
