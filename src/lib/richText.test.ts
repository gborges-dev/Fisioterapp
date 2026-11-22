import { describe, expect, it } from 'vitest'

import {
  isRichTextEmpty,
  looksLikeHtml,
  previewPlainText,
  richTextToPlainText,
  sanitizeRichTextHtml,
  stripHtml,
} from './richText'

describe('richText', () => {
  it('detecta HTML', () => {
    expect(looksLikeHtml('<p>Olá</p>')).toBe(true)
    expect(looksLikeHtml('texto simples')).toBe(false)
  })

  it('considera vazio conteúdo só com tags', () => {
    expect(isRichTextEmpty('<p></p>')).toBe(true)
    expect(isRichTextEmpty('<p><br></p>')).toBe(true)
    expect(isRichTextEmpty('<p>Texto</p>')).toBe(false)
  })

  it('remove tags no stripHtml', () => {
    expect(stripHtml('<p><strong>Olá</strong></p>')).toBe('Olá')
  })

  it('resume texto para preview', () => {
    expect(previewPlainText('<p>Texto longo de evolução clínica</p>', 10)).toBe(
      'Texto long…',
    )
  })

  it('preserva alinhamento de texto na sanitização', () => {
    expect(sanitizeRichTextHtml('<p style="text-align: center">Centro</p>')).toBe(
      '<p style="text-align: center">Centro</p>',
    )
  })

  it('remove estilos não permitidos na sanitização', () => {
    expect(
      sanitizeRichTextHtml('<p style="color: red; text-align: center">Texto</p>'),
    ).toBe('<p style="text-align: center">Texto</p>')
    expect(sanitizeRichTextHtml('<p style="color: red">Texto</p>')).toBe('<p>Texto</p>')
  })

  it('converte rich text em texto completo sem truncar', () => {
    const longo = 'a'.repeat(200)
    expect(
      richTextToPlainText(
        `<p><strong>Dor</strong> &amp; rigidez</p><p>${longo}</p><ul><li>Item 1</li><li>Item 2</li></ul>`,
      ),
    ).toBe(`Dor & rigidez\n${longo}\n- Item 1\n- Item 2`)
    expect(richTextToPlainText('Linha 1<br>Linha 2')).toBe('Linha 1\nLinha 2')
    expect(richTextToPlainText('texto simples')).toBe('texto simples')
  })
})
