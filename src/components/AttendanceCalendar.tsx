import { dateStr, daysInMonth, type MonthRef } from '../lib/payroll'

const HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

/**
 * Kalender kehadiran satu bulan — komponen presentasional murni:
 * tidak membaca store/Query, semua data masuk lewat props dan
 * ketukan tanggal keluar lewat callback `onToggle`.
 *
 * - `month`: bulan yang ditampilkan.
 * - `absentDates`: kumpulan tanggal 'YYYY-MM-DD' yang ditandai tidak hadir.
 * - `tanggalMulai`: tanggal sebelum ini terkunci (belum mulai kerja).
 * - `today`: tanggal hari ini; tanggal setelah ini terkunci (masa depan).
 */
export function AttendanceCalendar({
  month,
  absentDates,
  tanggalMulai,
  today,
  onToggle,
}: {
  month: MonthRef
  absentDates: ReadonlySet<string>
  tanggalMulai: string
  today: string
  onToggle: (tanggal: string) => void
}) {
  const dim = daysInMonth(month.year, month.month)
  // Senin sebagai hari pertama: geser indeks JS (Minggu=0) ke Senin=0
  const firstWeekday = new Date(month.year, month.month - 1, 1).getDay()
  const offset = (firstWeekday + 6) % 7
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ]

  return (
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
          const tanggal = dateStr(month.year, month.month, day)
          const belumMulai = tanggal < tanggalMulai
          const masaDepan = tanggal > today
          const disabled = belumMulai || masaDepan
          const absent = absentDates.has(tanggal)
          return (
            <button
              key={tanggal}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(tanggal)}
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
  )
}
