import { cn } from '@/lib/utils'
import { looksLikeHtml, sanitizeRichTextHtml } from '@/lib/richText'

export function RichTextContent({
  content,
  variant = 'body1',
}: {
  content: string
  variant?: 'body1' | 'body2'
}) {
  const textClass = cn(
    variant === 'body2' ? 'text-sm' : 'text-base',
    'text-foreground',
  )

  if (!content?.trim()) {
    return <p className={cn(textClass, 'text-muted-foreground')}>—</p>
  }

  if (looksLikeHtml(content)) {
    const safe = sanitizeRichTextHtml(content)
    return (
      <div
        className={cn(
          textClass,
          '[&_p]:mb-1 [&_p:last-child]:mb-0',
          '[&_ul]:mb-1 [&_ul]:ml-5 [&_ul]:list-disc',
          '[&_ol]:mb-1 [&_ol]:ml-5 [&_ol]:list-decimal',
          '[&_a]:text-primary [&_a]:underline',
        )}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    )
  }

  return <p className={cn(textClass, 'whitespace-pre-wrap')}>{content}</p>
}
