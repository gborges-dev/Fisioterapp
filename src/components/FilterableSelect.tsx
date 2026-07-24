import { ChevronDown, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type FilterableSelectOption<T> = {
  value: T
  label: string
}

function normalizeSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export function FilterableSelect<T>({
  options,
  value,
  onChange,
  label,
  placeholder = 'Selecionar…',
  emptyLabel = 'Todos',
  allowClear = true,
  loading = false,
  required = false,
  disabled = false,
  className,
  getOptionKey,
}: {
  options: FilterableSelectOption<T>[]
  value: T | null
  onChange: (value: T | null) => void
  label?: string
  placeholder?: string
  emptyLabel?: string
  allowClear?: boolean
  loading?: boolean
  required?: boolean
  disabled?: boolean
  className?: string
  getOptionKey: (item: T) => string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel = useMemo(() => {
    if (!value) return ''
    return (
      options.find((o) => getOptionKey(o.value) === getOptionKey(value))?.label ??
      ''
    )
  }, [value, options, getOptionKey])

  const filtered = useMemo(() => {
    const q = normalizeSearch(query)
    if (!q) return options
    return options.filter((o) => normalizeSearch(o.label).includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (next: T | null) => {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className={cn('relative space-y-1.5', className)}>
      {label ? (
        <Label>
          {label}
          {required ? ' *' : null}
        </Label>
      ) : null}
      <div className="relative">
        <Input
          value={open ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={selectedLabel || placeholder}
          disabled={disabled}
          className={cn('pr-16', !open && selectedLabel && 'text-foreground')}
          aria-expanded={open}
          aria-haspopup="listbox"
          autoComplete="off"
        />
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {allowClear && value && !disabled ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Limpar seleção"
              onClick={() => handleSelect(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Abrir lista"
            disabled={disabled}
            onClick={() => {
              if (disabled) return
              setOpen((v) => !v)
              if (!open) setQuery('')
            }}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            )}
          </Button>
        </div>
      </div>
      {open && !disabled ? (
        <div
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border glass-strong p-1 shadow-md"
        >
          {allowClear ? (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={cn(
                'flex w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                !value && 'bg-accent text-accent-foreground',
              )}
              onClick={() => handleSelect(null)}
            >
              {emptyLabel}
            </button>
          ) : null}
          {filtered.map((option) => {
            const key = getOptionKey(option.value)
            const isSelected =
              value != null && getOptionKey(value) === key
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  'flex w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isSelected && 'bg-accent text-accent-foreground',
                )}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            )
          })}
          {!loading && filtered.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              Nenhum resultado
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
