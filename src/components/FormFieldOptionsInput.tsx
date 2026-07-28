import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'

function parseOptionsFromInput(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

type FormFieldOptionsInputProps = {
  id: string
  fieldId: string
  options: string[] | undefined
  disabled?: boolean
  onOptionsChange: (options: string[]) => void
}

export function FormFieldOptionsInput({
  id,
  fieldId,
  options,
  disabled,
  onOptionsChange,
}: FormFieldOptionsInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  useEffect(() => {
    setDraft(null)
  }, [fieldId])

  const displayValue = draft ?? (options ?? []).join(', ')

  return (
    <Input
      id={id}
      value={displayValue}
      disabled={disabled}
      onChange={(e) => {
        const value = e.target.value
        setDraft(value)
        onOptionsChange(parseOptionsFromInput(value))
      }}
      onBlur={() => setDraft(null)}
    />
  )
}
