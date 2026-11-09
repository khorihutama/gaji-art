const rupiahFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

/** Format rupiah penuh: 2000000 -> "Rp2.000.000", -33333 -> "-Rp33.333". */
export function formatRupiah(n: number): string {
  return rupiahFmt.format(n)
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function namaBulan(month: number): string {
  return NAMA_BULAN[month - 1]
}

export function namaHari(dayIndex: number): string {
  return NAMA_HARI[dayIndex]
}

/** '2026-11-07' -> '7 November 2026' */
export function formatTanggal(s: string): string {
  const [y, m, d] = s.split('-').map(Number)
  return `${d} ${NAMA_BULAN[m - 1]} ${y}`
}

/** {year: 2026, month: 11} -> 'November 2026' */
export function formatBulan(ref: { year: number; month: number }): string {
  return `${NAMA_BULAN[ref.month - 1]} ${ref.year}`
}
