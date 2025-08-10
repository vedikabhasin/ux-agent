import type { Metadata } from "next"
import QuickUXAudit from "@/components/quick-ux-audit"

export const metadata: Metadata = {
  title: "Quick UX Audit",
  description: "Type a valid .com or URL to generate a fast UX audit of your landing page.",
}

export default function Page() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-neutral-50 to-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <header className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Quick UX Audit</h1>
          <p className="mt-3 text-neutral-600 max-w-2xl">
            Paste a .com domain or full URL. We&apos;ll review the page HTML and produce a concise, prioritized UX audit
            with actionable fixes.
          </p>
        </header>
        <QuickUXAudit />
        <footer className="mt-12 text-xs text-neutral-500">
          Note: This tool analyzes readily available HTML only. For password-protected or heavily scripted pages,
          results may be limited.
        </footer>
      </div>
    </main>
  )
}
