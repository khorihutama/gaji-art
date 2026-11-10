import { Link } from '@tanstack/react-router'
import type { Worker } from '../lib/types'
import {
  absentDateSet,
  monthKey,
  monthlySummary,
  parseDate,
  parseMonthKey,
  todayStr,
} from '../lib/payroll'
import { newId, useAppData, usePersistentState, useUpdateData } from '../lib/store'
import { formatRupiah } from '../lib/format'
import { EmptyState, MonthNav, WorkerSelect } from '../components/ui'
import { AttendanceCalendar } from '../components/AttendanceCalendar'

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

      <AttendanceCalendar
        month={ref}
        absentDates={absentSet}
        tanggalMulai={worker.tanggalMulai}
        today={today}
        onToggle={toggle}
      />

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
