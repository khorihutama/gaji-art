import type { Taking, Worker } from './types'

/**
 * Mesin hitung gaji ART — fungsi murni, tanpa efek samping.
 *
 * Aturan (sesuai spec):
 * - Gaji diinput per bulan. Tarif harian = gaji bulanan ÷ jumlah hari
 *   kalender pada bulan tersebut (November 30 hari, Februari 28/29 hari),
 *   sehingga kerja hadir penuh sebulan selalu pas sebesar gaji bulanan.
 * - ART bekerja setiap hari: hari sejak tanggal mulai sampai hari ini
 *   (atau akhir bulan untuk bulan yang sudah lewat) dianggap HADIR,
 *   kecuali tanggal yang ditandai tidak hadir.
 * - Tanggal di masa depan dan tanggal sebelum mulai kerja tidak dihitung.
 * - Pembulatan ke rupiah penuh dilakukan per bulan (Math.round).
 * - Saldo bersifat kumulatif: total hak gaji − total uang yang diambil.
 *   Saldo negatif (kasbon melebihi hak) otomatis terbawa ke bulan
 *   berikutnya sebagai hutang.
 *
 * Semua tanggal memakai string 'YYYY-MM-DD' agar perbandingan leksikografis
 * sama dengan perbandingan kronologis dan bebas masalah zona waktu.
 */

export interface MonthRef {
  year: number
  /** 1–12 */
  month: number
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function dateStr(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function parseDate(s: string): { year: number; month: number; day: number } {
  const [year, month, day] = s.split('-').map(Number)
  return { year, month, day }
}

export function todayStr(now = new Date()): string {
  return dateStr(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/** Jumlah hari kalender dalam bulan (month 1–12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function monthRefOf(date: string): MonthRef {
  const { year, month } = parseDate(date)
  return { year, month }
}

export function monthKey(ref: MonthRef): string {
  return `${ref.year}-${pad2(ref.month)}`
}

export function parseMonthKey(key: string): MonthRef {
  const [year, month] = key.split('-').map(Number)
  return { year, month }
}

export function addMonths(ref: MonthRef, delta: number): MonthRef {
  const d = new Date(ref.year, ref.month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function monthStart(ref: MonthRef): string {
  return dateStr(ref.year, ref.month, 1)
}

export function monthEnd(ref: MonthRef): string {
  return dateStr(ref.year, ref.month, daysInMonth(ref.year, ref.month))
}

/** Geser tanggal sejumlah hari (boleh negatif). */
export function shiftDate(s: string, deltaDays: number): string {
  const { year, month, day } = parseDate(s)
  const d = new Date(year, month - 1, day + deltaDays)
  return dateStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

/** Daftar semua tanggal dari `from` sampai `to` (inklusif). Kosong bila from > to. */
export function eachDate(from: string, to: string): string[] {
  const out: string[] = []
  for (let cur = from; cur <= to; cur = shiftDate(cur, 1)) out.push(cur)
  return out
}

/** Kumpulan tanggal tidak hadir milik satu pekerja. */
export function absentDateSet(
  absences: readonly { workerId: string; tanggal: string }[],
  workerId: string,
): Set<string> {
  return new Set(absences.filter((a) => a.workerId === workerId).map((a) => a.tanggal))
}

/** Tarif harian pada bulan tertentu: gaji bulanan ÷ hari kalender bulan itu. */
export function dailyRate(worker: Worker, ref: MonthRef): number {
  return worker.gajiBulanan / daysInMonth(ref.year, ref.month)
}

/**
 * Jumlah hari hadir pada satu bulan, dihitung sampai `asOf`
 * (tanggal masa depan tidak pernah dihitung; gunakan hari ini untuk
 * bulan berjalan dan akhir bulan untuk bulan yang sudah lewat).
 */
export function presentDaysInMonth(
  worker: Worker,
  absentDates: ReadonlySet<string>,
  ref: MonthRef,
  asOf: string,
): number {
  const start = worker.tanggalMulai > monthStart(ref) ? worker.tanggalMulai : monthStart(ref)
  const end = asOf < monthEnd(ref) ? asOf : monthEnd(ref)
  if (end < start) return 0
  let count = 0
  for (const d of eachDate(start, end)) {
    if (!absentDates.has(d)) count++
  }
  return count
}

/** Hak gaji (accrued) satu bulan, dibulatkan ke rupiah penuh. */
export function accruedForMonth(
  worker: Worker,
  absentDates: ReadonlySet<string>,
  ref: MonthRef,
  asOf: string,
): number {
  const present = presentDaysInMonth(worker, absentDates, ref, asOf)
  return Math.round((worker.gajiBulanan * present) / daysInMonth(ref.year, ref.month))
}

/** Total hak gaji dari tanggal mulai kerja sampai `through` (inklusif). */
export function accruedThrough(
  worker: Worker,
  absentDates: ReadonlySet<string>,
  through: string,
): number {
  if (through < worker.tanggalMulai) return 0
  let total = 0
  let ref = monthRefOf(worker.tanggalMulai)
  const last = monthRefOf(through)
  while (monthKey(ref) <= monthKey(last)) {
    total += accruedForMonth(worker, absentDates, ref, through)
    ref = addMonths(ref, 1)
  }
  return total
}

/** Total uang yang sudah diambil sampai `through` (inklusif). */
export function totalTakenThrough(
  takings: readonly Taking[],
  workerId: string,
  through: string,
): number {
  return takings
    .filter((t) => t.workerId === workerId && t.tanggal <= through)
    .reduce((sum, t) => sum + t.nominal, 0)
}

/** Total uang yang diambil di dalam satu bulan kalender. */
export function totalTakenInMonth(
  takings: readonly Taking[],
  workerId: string,
  ref: MonthRef,
): number {
  return takings
    .filter(
      (t) =>
        t.workerId === workerId &&
        t.tanggal >= monthStart(ref) &&
        t.tanggal <= monthEnd(ref),
    )
    .reduce((sum, t) => sum + t.nominal, 0)
}

/**
 * Saldo kumulatif sampai `through`: hak gaji − uang diambil.
 * Positif = masih ada sisa hak; negatif = hutang (kasbon berlebih).
 */
export function balanceThrough(
  worker: Worker,
  absentDates: ReadonlySet<string>,
  takings: readonly Taking[],
  through: string,
): number {
  return (
    accruedThrough(worker, absentDates, through) -
    totalTakenThrough(takings, worker.id, through)
  )
}

export interface MonthlySummary {
  ref: MonthRef
  /** Saldo di awal bulan (saldo kumulatif akhir bulan sebelumnya) — inilah hutang/sisa yang terbawa. */
  openingBalance: number
  /** Hak gaji yang terbentuk bulan ini (sampai `asOf`). */
  accrued: number
  /** Uang yang diambil bulan ini (kasbon + pelunasan). */
  taken: number
  /** openingBalance + accrued − taken. */
  closingBalance: number
  /** Jumlah hari hadir bulan ini (sampai `asOf`). */
  presentDays: number
  /** Jumlah hari tidak hadir bulan ini (sampai `asOf`). */
  absentDays: number
}

export function monthlySummary(
  worker: Worker,
  absentDates: ReadonlySet<string>,
  takings: readonly Taking[],
  ref: MonthRef,
  asOf: string,
): MonthlySummary {
  const openingBalance = balanceThrough(
    worker,
    absentDates,
    takings,
    shiftDate(monthStart(ref), -1),
  )
  const accrued = accruedForMonth(worker, absentDates, ref, asOf)
  const taken = totalTakenInMonth(takings, worker.id, ref)
  const present = presentDaysInMonth(worker, absentDates, ref, asOf)

  const start =
    worker.tanggalMulai > monthStart(ref) ? worker.tanggalMulai : monthStart(ref)
  const end = asOf < monthEnd(ref) ? asOf : monthEnd(ref)
  const elapsed = end >= start ? eachDate(start, end).length : 0

  return {
    ref,
    openingBalance,
    accrued,
    taken,
    closingBalance: openingBalance + accrued - taken,
    presentDays: present,
    absentDays: elapsed - present,
  }
}
