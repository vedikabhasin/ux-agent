export function isAcceptableInput(input: string): boolean {
  const trimmed = input.trim()
  if (!trimmed) return false

  // Allow full URL with http/https
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed)
      return Boolean(u.hostname)
    } catch {
      return false
    }
  }

  // Allow bare .com domains only (e.g., example.com, sub.example.com)
  const domainRegex = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,}$/i
  if (domainRegex.test(trimmed) && trimmed.toLowerCase().endsWith(".com")) {
    return true
  }

  return false
}

export function normalizeInputToUrl(input: string): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = input.trim()
  if (!isAcceptableInput(trimmed)) {
    return { ok: false, error: "Invalid input. Enter a .com domain or full URL." }
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed)
      return { ok: true, url: u.toString() }
    } catch {
      return { ok: false, error: "Invalid URL." }
    }
  }
  // Normalize bare domain to https
  return { ok: true, url: `https://${trimmed}` }
}
