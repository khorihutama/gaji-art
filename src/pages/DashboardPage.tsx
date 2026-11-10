import { Link } from '@tanstack/react-router'
import {
  absentDateSet,
  balanceThrough,
  monthKey,
  monthlySummary,
  parseDate,
  parseMonthKey,
  todayStr,
} from '../lib/payroll'
import { useAppData, usePersistentState } from '../lib/store'
import { EmptyState, MonthNav } from '../components/ui'
import { WorkerCard } from '../components/WorkerCard'

export default function DashboardPage() {
  const data = useAppData()
  const today = todayStr()
  const [, setWorkerId] = usePersistentState('gaji-art:workerId', '')
  const [bulanKey, setBulanKey] = usePersistentState(
    'gaji-art:month',
    monthKey(parseDate(today)),
  )
  const ref = parseMonthKey(bulanKey)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Dashboard Gaji ART</h1>
        <p className="text-sm text-stone-500">
          Hak gaji dihitung harian dari gaji bulanan. Kasbon yang melebihi hak
          otomatis menjadi hutang bulan berikutnya.
        </p>
      </div>

      <MonthNav value={ref} onChange={(r) => setBulanKey(monthKey(r))} />

      {data.workers.length === 0 ? (
        <EmptyState title="Mulai dari menambahkan ART">
          <ol className="mx-auto mt-2 max-w-sm list-decimal space-y-1 text-left">
            <li>
              Tambahkan ART di halaman{' '}
              <Link to="/art" className="font-semibold text-emerald-700 underline">
                ART
              </Link>{' '}
              (nama, gaji per bulan, tanggal mulai).
            </li>
            <li>Tandai hari tidak hadir di kalender Kehadiran — hari lain otomatis hadir.</li>
            <li>Catat setiap kasbon / pengambilan uang di halaman Ambil Uang.</li>
          </ol>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {data.workers.map((w) => {
            const absentSet = absentDateSet(data.absences, w.id)
            const summary = monthlySummary(w, absentSet, data.takings, ref, today)
            const saldoSekarang = balanceThrough(w, absentSet, data.takings, today)
            return (
              <WorkerCard
                key={w.id}
                worker={w}
                summary={summary}
                balance={saldoSekarang}
                onLihatRekap={() => setWorkerId(w.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
