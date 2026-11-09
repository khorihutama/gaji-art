import type { ReactNode } from 'react'
import { addMonths, type MonthRef } from '../lib/payroll'
import { formatBulan } from '../lib/format'
import type { Worker } from '../lib/types'

export const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
export const labelClass = 'mb-1 block text-sm font-medium text-stone-700'
export const errorClass = 'mt-1 text-sm text-red-600'

export const primaryBtn =
  'rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white active:bg-emerald-800 disabled:opacity-50'
export const ghostBtn =
  'rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 active:bg-stone-100'

export function FieldError({ errors }: { errors: unknown[] }) {
  const first = errors[0]
  if (!first) return null
  const msg =
    typeof first === 'string'
      ? first
      : (first as { message?: string })?.message ?? 'Tidak valid'
  return <p className={errorClass}>{msg}</p>
}

export function MonthNav({
  value,
  onChange,
}: {
  value: MonthRef
  onChange: (ref: MonthRef) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-1.5 shadow-sm">
      <button
        type="button"
        aria-label="Bulan sebelumnya"
        className="rounded-xl px-3 py-2 text-lg font-bold text-stone-600 active:bg-stone-100"
        onClick={() => onChange(addMonths(value, -1))}
      >
        ‹
      </button>
      <span className="font-semibold">{formatBulan(value)}</span>
      <button
        type="button"
        aria-label="Bulan berikutnya"
        className="rounded-xl px-3 py-2 text-lg font-bold text-stone-600 active:bg-stone-100"
        onClick={() => onChange(addMonths(value, 1))}
      >
        ›
      </button>
    </div>
  )
}

export function WorkerSelect({
  workers,
  value,
  onChange,
  label = 'Pilih ART',
}: {
  workers: Worker[]
  value: string
  onChange: (id: string) => void
  label?: string
}) {
  return (
    <div>
      <label className={labelClass} htmlFor="worker-select">
        {label}
      </label>
      <select
        id="worker-select"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {workers.map((w) => (
          <option key={w.id} value={w.id}>
            {w.nama}
            {w.aktif ? '' : ' (nonaktif)'}
          </option>
        ))}
      </select>
    </div>
  )
}

export function EmptyState({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/60 px-4 py-8 text-center">
      <p className="font-semibold text-stone-700">{title}</p>
      {children && <div className="mt-1 text-sm text-stone-500">{children}</div>}
    </div>
  )
}

/** Chip status dari saldo kumulatif: positif = sisa hak, 0 = lunas, negatif = hutang. */
export function StatusChip({ balance }: { balance: number }) {
  if (balance > 0)
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        Sisa hak
      </span>
    )
  if (balance < 0)
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
        Hutang
      </span>
    )
  return (
    <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600">
      Lunas
    </span>
  )
}

export function SummaryRow({
  label,
  value,
  strong,
  valueClass,
}: {
  label: string
  value: string
  strong?: boolean
  valueClass?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className={`text-sm ${strong ? 'font-semibold' : 'text-stone-500'}`}>{label}</span>
      <span
        className={`money text-right ${strong ? 'text-base font-bold' : 'font-medium'} ${valueClass ?? ''}`}
      >
        {value}
      </span>
    </div>
  )
}
