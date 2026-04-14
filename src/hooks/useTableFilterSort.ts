import { useMemo, useState } from 'react'

export type Order = 'asc' | 'desc'

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

export function useTableFilterSort<T>({
  rows,
  filterText,
  getFilterHaystack,
  orderBy,
  order,
  compare,
}: {
  rows: T[] | undefined
  filterText: string
  getFilterHaystack: (row: T) => string
  orderBy: keyof T | string
  order: Order
  compare: (a: T, b: T, orderBy: keyof T | string) => number
}) {
  return useMemo(() => {
    if (!rows?.length) return []
    const q = normalize(filterText.trim())
    const filtered = q
      ? rows.filter((row) => normalize(getFilterHaystack(row)).includes(q))
      : [...rows]
    const list = [...filtered]
    list.sort((a, b) => {
      const c = compare(a, b, orderBy)
      return order === 'asc' ? c : -c
    })
    return list
  }, [rows, filterText, orderBy, order, getFilterHaystack, compare])
}

export function useSortState<K extends string>(defaultOrderBy: K) {
  const [orderBy, setOrderBy] = useState<K>(defaultOrderBy)
  const [order, setOrder] = useState<Order>('asc')

  const handleRequestSort = (property: K) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  return { orderBy, order, handleRequestSort }
}
