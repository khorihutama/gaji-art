import { Link } from '@tanstack/react-router'
import type { Worker } from '../lib/types'
import {
  absentDateSet,
  dateStr,
  daysInMonth,
  monthKey,
  monthlySummary,
  parseDate,
  parseMonthKey,
  todayStr,
} from '../lib/payroll'
import { newId, useAppData, usePersistentState, useUpdateData } from '../lib/store'
import { formatRupiah } from '../lib/format'
import { EmptyState, MonthNav, WorkerSelect } from '../components/ui'

const HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export default function KehadiranPage() {
  const data = useAppData()
  const updateData = useUpdateData()
  const today = todayStr()

  const [workerId, setWorkerId] = usePersistentState('gaji-art:workerId', '')
  const [bulanKey, setBulanKey] = usePersistentState(
    'gaji-art:month',
    monthKey(parseDate(today)),
  )
  const ref = parseMonthKey(bulanKey)

  const worker: Worker | undefined =
    data.workers.find((w) => w.id === workerId) ?? data.workers[0]

  if (data.workers.length === 0 || !worker) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Kehadiran</h1>
        <EmptyState title="Belum ada data ART">
          Tambahkan data ART dulu, setelah itu kalender kehadiran bisa dipakai.{' '}
          <Link to="/art" className="font-semibold text-emerald-700 underline">
            Ke halaman ART →
          </Link>
        </EmptyState>
      </div>
    )
  }

  const absentSet = absentDateSet(data.absences, worker.id)
  const summary = monthlySummary(worker, absentSet, data.takings, ref, today)

  const dim = daysInMonth(ref.year, ref.month)
  // Senin sebagai hari pertama: geser indeks JS (Minggu=0) ke Senin=0
  const firstWeekday = new Date(ref.year, ref.month - 1, 1).getDay()
  const offset = (firstWeekday + 6) % 7
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ]

  const toggle = (tanggal: string) => {
    updateData((d) => {
      const existing = d.absences.find(
        (a) => a.workerId === worker.id && a.tanggal === tanggal,
      )
      return existing
        ? { ...d, absences: d.absences.filter((a) => a.id !== existing.id) }
        : {
            ...d,
            absences: [...d.absences, { id: newId(), workerId: worker.id, tanggal }],
          }
    })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Kehadiran</h1>

      <WorkerSelect
        workers={data.workers}
        value={worker.id}
        onChange={setWorkerId}
      />
      <MonthNav value={ref} onChange={(r) => setBulanKey(monthKey(r))} />

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-stone-400">
          {HEADERS.map((h) => (
            <div key={h} className="py-1">
              {h}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`kosong-${i}`} />
            const tanggal = dateStr(ref.year, ref.month, day)
            const belumMulai = tanggal < worker.tanggalMulai
            const masaDepan = tanggal > today
            const disabled = belumMulai || masaDepan
            const absent = absentSet.has(tanggal)
            return (
              <button
                key={tanggal}
                type="button"
                disabled={disabled}
                onClick={() => toggle(tanggal)}
                aria-label={`${tanggal}${absent ? ' tidak hadir' : ' hadir'}`}
                className={[
                  'flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold transition',
                  disabled
                    ? 'cursor-not-allowed bg-stone-50 text-stone-300'
                    : absent
                      ? 'bg-red-100 text-red-700 active:bg-red-200'
                      : 'bg-emerald-100 text-emerald-800 active:bg-emerald-200',
                  tanggal === today ? 'ring-2 ring-emerald-600 ring-inset' : '',
                ].join(' ')}
              >
                {day}
                {!disabled && <span className="text-[10px] leading-none">{absent ? '✕' : '✓'}</span>}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Ketuk tanggal untuk mengubah hadir ↔ tidak hadir. Hari sejak tanggal
          mulai kerja otomatis dianggap hadir — cukup tandai hari yang tidak
          hadir saja. Tanggal abu-abu (belum mulai kerja / masa depan) tidak
          dihitung.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-lg font-bold text-emerald-700">{summary.presentDays}</p>
          <p className="text-xs text-stone-500">Hari hadir</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-lg font-bold text-red-600">{summary.absentDays}</p>
          <p className="text-xs text-stone-500">Tidak hadir</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="money text-lg font-bold">{formatRupiah(summary.accrued)}</p>
          <p className="text-xs text-stone-500">Hak gaji bulan ini</p>
        </div>
      </div>
    </div>
  )
}
