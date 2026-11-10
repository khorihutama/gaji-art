import { Link } from '@tanstack/react-router'
import type { MonthlySummary } from '../lib/payroll'
import type { Worker } from '../lib/types'
import { formatRupiah } from '../lib/format'
import { StatusChip, SummaryRow } from './ui'

/**
 * Kartu ringkasan satu ART di Dashboard — komponen presentasional.
 * Halaman yang menghitung `summary` (ringkasan bulan terpilih) dan
 * `balance` (saldo kumulatif sampai hari ini) lewat lib/payroll;
 * `onLihatRekap` dipanggil saat tautan rekap diketuk agar halaman
 * bisa mengatur ART terpilih sebelum berpindah ke halaman Rekap.
 */
export function WorkerCard({
  worker,
  summary,
  balance,
  onLihatRekap,
}: {
  worker: Worker
  summary: MonthlySummary
  balance: number
  onLihatRekap: () => void
}) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">
          {worker.nama}
          {!worker.aktif && (
            <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">
              Nonaktif
            </span>
          )}
        </h2>
        <StatusChip balance={balance} />
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
          value={formatRupiah(balance)}
          strong
          valueClass={balance < 0 ? 'text-red-600' : 'text-emerald-700'}
        />
      </div>
      <p className="mt-1 text-xs text-stone-500">
        {summary.presentDays} hari hadir bulan ini · gaji{' '}
        {formatRupiah(worker.gajiBulanan)}/bulan
      </p>
      <Link
        to="/rekap"
        onClick={onLihatRekap}
        className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline"
      >
        Lihat rekap {worker.nama} →
      </Link>
    </article>
  )
}
