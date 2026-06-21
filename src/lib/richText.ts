export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isRichTextEmpty(html: string): boolean {
  return !stripHtml(html)
}

export function looksLikeHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content)
}

export function previewPlainText(content: string, maxLen = 80): string {
  const plain = stripHtml(content)
  if (plain.length <= maxLen) return plain
  return `${plain.slice(0, maxLen).trim()}…`
}
