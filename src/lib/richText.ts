import DOMPurify from 'dompurify'

export const RICH_TEXT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'h3',
  'a',
]

let richTextSanitizerReady = false

function ensureRichTextSanitizer() {
  if (richTextSanitizerReady) return

  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'style') return

    const match = data.attrValue.match(/text-align:\s*(left|right|center|justify)/i)
    if (!match) {
      data.keepAttr = false
      return
    }

    data.attrValue = `text-align: ${match[1].toLowerCase()}`
  })

  richTextSanitizerReady = true
}

export function sanitizeRichTextHtml(content: string): string {
  ensureRichTextSanitizer()

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
  })
}

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
