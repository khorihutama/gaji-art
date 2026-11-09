import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import type { Taking, Worker } from '../lib/types'
import {
  absentDateSet,
  monthKey,
  monthlySummary,
  parseDate,
  parseMonthKey,
  todayStr,
} from '../lib/payroll'
import { useAppData, usePersistentState } from '../lib/store'
import { JENIS_LABEL, METODE_LABEL, formatRupiah, formatTanggal } from '../lib/format'
import {
  EmptyState,
  MonthNav,
  StatusChip,
  SummaryRow,
  WorkerSelect,
  ghostBtn,
} from '../components/ui'

const columns: ColumnDef<Taking>[] = [
  {
    accessorKey: 'tanggal',
    header: 'Tanggal',
    cell: (info) => formatTanggal(info.getValue<string>()),
  },
  {
    accessorKey: 'jenis',
    header: 'Jenis',
    cell: (info) => JENIS_LABEL[info.getValue<string>()] ?? info.getValue<string>(),
  },
  {
    accessorKey: 'keterangan',
    header: 'Keterangan',
    cell: (info) => info.getValue<string>() || '—',
  },
  {
    accessorKey: 'metode',
    header: 'Metode',
    cell: (info) => METODE_LABEL[info.getValue<string>()] ?? info.getValue<string>(),
  },
  {
    accessorKey: 'nominal',
    header: () => <span className="block text-right">Nominal</span>,
    cell: (info) => (
      <span className="money block text-right font-semibold">
        {formatRupiah(info.getValue<number>())}
      </span>
    ),
  },
]

function RiwayatTable({ takings }: { takings: Taking[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'tanggal', desc: true }])
  const table = useReactTable({
    data: takings,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  if (takings.length === 0) {
    return (
      <EmptyState title="Belum ada riwayat pengambilan">
        Riwayat kasbon & pelunasan ART ini akan tampil di sini.
      </EmptyState>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-stone-200 bg-stone-50 text-left">
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2.5 font-semibold text-stone-600">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-stone-100 last:border-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between border-t border-stone-100 px-3 py-2">
          <button
            className={ghostBtn}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ‹ Sebelumnya
          </button>
          <span className="text-sm text-stone-500">
            Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
          </span>
          <button
            className={ghostBtn}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Berikutnya ›
          </button>
        </div>
      )}
    </div>
  )
}

export default function RekapPage() {
  const data = useAppData()
  const today = todayStr()
  const [workerId, setWorkerId] = usePersistentState('gaji-art:workerId', '')
  const [bulanKey, setBulanKey] = usePersistentState(
    'gaji-art:month',
    monthKey(parseDate(today)),
  )
  const ref = parseMonthKey(bulanKey)

  const worker: Worker | undefined =
    data.workers.find((w) => w.id === workerId) ?? data.workers[0]

  const workerTakings = useMemo(
    () => (worker ? data.takings.filter((t) => t.workerId === worker.id) : []),
    [data.takings, worker],
  )

  if (data.workers.length === 0 || !worker) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Rekap</h1>
        <EmptyState title="Belum ada data ART">
          Tambahkan data ART dulu untuk melihat rekap gajinya.{' '}
          <Link to="/art" className="font-semibold text-emerald-700 underline">
            Ke halaman ART →
          </Link>
        </EmptyState>
      </div>
    )
  }

  const absentSet = absentDateSet(data.absences, worker.id)
  const s = monthlySummary(worker, absentSet, data.takings, ref, today)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Rekap Gaji</h1>

      <WorkerSelect workers={data.workers} value={worker.id} onChange={setWorkerId} />
      <MonthNav value={ref} onChange={(r) => setBulanKey(monthKey(r))} />

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Ringkasan {worker.nama}</h2>
          <StatusChip balance={s.closingBalance} />
        </div>
        <div className="mt-1 divide-y divide-stone-100">
          <SummaryRow
            label="Saldo awal bulan (terbawa)"
            value={formatRupiah(s.openingBalance)}
            valueClass={s.openingBalance < 0 ? 'text-red-600' : undefined}
          />
          <SummaryRow
            label={`Hak gaji bulan ini (${s.presentDays} hari hadir, ${s.absentDays} tidak hadir)`}
            value={formatRupiah(s.accrued)}
          />
          <SummaryRow label="Diambil bulan ini" value={formatRupiah(s.taken)} />
          <SummaryRow
            label="Saldo akhir bulan"
            value={formatRupiah(s.closingBalance)}
            strong
            valueClass={s.closingBalance < 0 ? 'text-red-600' : 'text-emerald-700'}
          />
        </div>
        {s.closingBalance < 0 && (
          <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            Saldo negatif: hutang {formatRupiah(-s.closingBalance)} otomatis terbawa
            dan mengurangi hak gaji bulan berikutnya.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Riwayat Pengambilan — {worker.nama}</h2>
        <RiwayatTable takings={workerTakings} />
      </section>
    </div>
  )
}
