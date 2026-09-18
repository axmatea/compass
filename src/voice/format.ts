/** Render-only formatting of v1 values. No state interpretation lives here. */
import type { FieldName, FieldValue } from './types'

export const FIELD_ORDER: FieldName[] = ['task', 'date', 'time', 'cuisine', 'location', 'party_size']
const LABELS: Record<FieldName, string> = { task: 'Plan', date: 'When', time: 'Time', cuisine: 'Cuisine', location: 'Near', party_size: 'Party' }
export const labelFor = (f: string) => LABELS[f as FieldName] ?? f

export function time12(v: FieldValue): string | null {
  if (v == null) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(v))
  if (!m) return String(v)
  const h = Number(m[1]); const min = m[2]
  return `${h % 12 === 0 ? 12 : h % 12}:${min} ${h >= 12 ? 'PM' : 'AM'}`
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function formatValue(field: string, v: FieldValue): string | null {
  if (v == null || v === '') return null
  if (field === 'time') return time12(v)
  if (field === 'party_size') return `${v} ${Number(v) === 1 ? 'person' : 'people'}`
  return cap(String(v))
}

export const toolLabel = (tool: string) => cap(tool.replace(/^mock_/, '').replace(/_/g, ' '))
