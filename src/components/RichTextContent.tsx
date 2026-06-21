import DOMPurify from 'dompurify'
import { Box, Typography } from '@mui/material'

import { looksLikeHtml } from '../lib/richText'

const ALLOWED_TAGS = [
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

export function RichTextContent({
  content,
  variant = 'body1',
}: {
  content: string
  variant?: 'body1' | 'body2'
}) {
  if (!content?.trim()) {
    return (
      <Typography variant={variant} color="text.secondary">
        —
      </Typography>
    )
  }

  if (looksLikeHtml(content)) {
    const safe = DOMPurify.sanitize(content, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    })
    return (
      <Box
        component="div"
        sx={{
          typography: variant,
          '& p': { margin: 0, marginBottom: 0.5 },
          '& p:last-child': { marginBottom: 0 },
          '& ul, & ol': { margin: 0, pl: 2.5, mb: 0.5 },
          '& a': { color: 'primary.main' },
        }}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    )
  }

  return (
    <Typography variant={variant} sx={{ whiteSpace: 'pre-wrap' }}>
      {content}
    </Typography>
  )
}
