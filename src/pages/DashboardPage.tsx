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
import { formatRupiah } from '../lib/format'
import { EmptyState, MonthNav, StatusChip, SummaryRow } from '../components/ui'

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
              <article key={w.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-bold">
                    {w.nama}
                    {!w.aktif && (
                      <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">
                        Nonaktif
                      </span>
                    )}
                  </h2>
                  <StatusChip balance={saldoSekarang} />
                </div>
                <div className="mt-1 divide-y divide-stone-100">
                  <SummaryRow
                    label="Saldo awal bulan ini"
                    value={formatRupiah(summary.openingBalance)}
                    valueClass={summary.openingBalance < 0 ? 'text-red-600' : undefined}
                  />
                  <SummaryRow label="Hak gaji bulan ini" value={formatRupiah(summary.accrued)} />
                  <SummaryRow label="Diambil bulan ini" value={formatRupiah(summary.taken)} />
                  <SummaryRow
                    label="Saldo kumulatif saat ini"
                    value={formatRupiah(saldoSekarang)}
                    strong
                    valueClass={saldoSekarang < 0 ? 'text-red-600' : 'text-emerald-700'}
                  />
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {summary.presentDays} hari hadir bulan ini · gaji{' '}
                  {formatRupiah(w.gajiBulanan)}/bulan
                </p>
                <Link
                  to="/rekap"
                  onClick={() => setWorkerId(w.id)}
                  className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline"
                >
                  Lihat rekap {w.nama} →
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
