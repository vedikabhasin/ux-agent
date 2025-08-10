import type { Metadata } from "next"
import AuditClient from "./audit-client"

export const metadata: Metadata = {
  title: "Quick UX Audit (Dummy)",
}

export default function AuditPage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <AuditClient defaultUrl="https://blendbases.com" />
      </div>
    </main>
  )
}
