import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import RedoIcon from '@mui/icons-material/Redo'
import UndoIcon from '@mui/icons-material/Undo'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

export function RichTextEditor({
  label,
  value,
  onChange,
  minHeight = 160,
}: {
  label: string
  value: string
  onChange: (html: string) => void
  minHeight?: number
}) {
  const theme = useTheme()

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) {
    return null
  }

  const btn = (active: boolean) => ({
    color: active ? 'primary.main' : 'text.secondary',
    bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
  })

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
          },
        }}
      >
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={0.25}
          sx={{
            px: 0.5,
            py: 0.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <IconButton
            size="small"
            aria-label="Negrito"
            onClick={() => editor.chain().focus().toggleBold().run()}
            sx={btn(editor.isActive('bold'))}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Itálico"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            sx={btn(editor.isActive('italic'))}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Lista com marcas"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            sx={btn(editor.isActive('bulletList'))}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Lista numerada"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            sx={btn(editor.isActive('orderedList'))}
          >
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Desfazer"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Refazer"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Box
          sx={{
            px: 1.5,
            py: 1,
            minHeight: { xs: 120, sm: minHeight },
            '& .tiptap': {
              outline: 'none',
              minHeight: { xs: 96, sm: minHeight - 32 },
              typography: 'body1',
              '& p': { margin: 0, marginBottom: 0.5 },
              '& p:last-child': { marginBottom: 0 },
              '& ul, & ol': { margin: 0, pl: 2.5, mb: 0.5 },
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </Box>
    </Box>
  )
}
