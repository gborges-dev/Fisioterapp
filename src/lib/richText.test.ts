import { describe, expect, it } from 'vitest'

import { isRichTextEmpty, looksLikeHtml, previewPlainText, stripHtml } from './richText'

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
})
