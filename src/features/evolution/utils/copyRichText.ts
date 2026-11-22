import {
  looksLikeHtml,
  richTextToPlainText,
  sanitizeRichTextHtml,
} from '@/lib/richText'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Copia rich text para a área de transferência (HTML + texto simples). */
export async function copyRichTextToClipboard(content: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('Área de transferência indisponível.')
  }

  const plain = richTextToPlainText(content)

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
    const html = looksLikeHtml(content)
      ? sanitizeRichTextHtml(content)
      : `<p>${escapeHtml(plain).replace(/\n/g, '<br>')}</p>`
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      }),
    ])
    return
  }

  await navigator.clipboard.writeText(plain)
}
