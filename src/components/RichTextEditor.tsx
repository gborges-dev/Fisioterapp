import TextAlign from '@tiptap/extension-text-align'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

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
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
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

  const toolbarBtn = (active: boolean) =>
    cn(active && 'bg-primary/10 text-primary')

  return (
    <div>
      <Label className="mb-2 block text-muted-foreground">{label}</Label>
      <div className="overflow-hidden rounded-xl border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <div className="flex flex-wrap gap-0.5 border-b border-border bg-primary/5 px-1 py-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', toolbarBtn(editor.isActive('bold')))}
            aria-label="Negrito"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', toolbarBtn(editor.isActive('italic')))}
            aria-label="Itálico"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', toolbarBtn(editor.isActive('bulletList')))}
            aria-label="Lista com marcas"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', toolbarBtn(editor.isActive('orderedList')))}
            aria-label="Lista numerada"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              toolbarBtn(editor.isActive({ textAlign: 'left' })),
            )}
            aria-label="Alinhar à esquerda"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              toolbarBtn(editor.isActive({ textAlign: 'center' })),
            )}
            aria-label="Centralizar"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              toolbarBtn(editor.isActive({ textAlign: 'right' })),
            )}
            aria-label="Alinhar à direita"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Desfazer"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Refazer"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
        <div
          className="px-4 py-3"
          style={{ minHeight: Math.max(120, minHeight) }}
        >
          <EditorContent
            editor={editor}
            className={cn(
              '[&_.tiptap]:min-h-[96px] [&_.tiptap]:outline-none',
              '[&_.tiptap_p]:mb-1 [&_.tiptap_p:last-child]:mb-0',
              '[&_.tiptap_ul]:mb-1 [&_.tiptap_ul]:ml-5 [&_.tiptap_ul]:list-disc',
              '[&_.tiptap_ol]:mb-1 [&_.tiptap_ol]:ml-5 [&_.tiptap_ol]:list-decimal',
            )}
          />
        </div>
      </div>
    </div>
  )
}
