export type JenisPengambilan = 'kasbon' | 'pelunasan'
export type MetodePembayaran = 'tunai' | 'transfer' | 'e-wallet'

export interface Worker {
  id: string
  nama: string
  /** Gaji pokok per bulan, dalam rupiah penuh (contoh: 2000000). */
  gajiBulanan: number
  /** Tanggal mulai kerja, format 'YYYY-MM-DD'. */
  tanggalMulai: string
  aktif: boolean
  catatan?: string
}

export interface Absence {
  id: string
  workerId: string
  /** Tanggal tidak hadir, format 'YYYY-MM-DD'. Kehadiran disimpan sebagai pengecualian: hari lain dianggap hadir. */
  tanggal: string
}

export interface Taking {
  id: string
  workerId: string
  /** Tanggal uang diambil, format 'YYYY-MM-DD'. */
  tanggal: string
  /** Nominal dalam rupiah penuh, selalu > 0. */
  nominal: number
  /** kasbon = ambil di muka; pelunasan = pembayaran sisa gaji. */
  jenis: JenisPengambilan
  keterangan: string
  metode: MetodePembayaran
}

export interface AppData {
  workers: Worker[]
  absences: Absence[]
  takings: Taking[]
}

export const emptyData: AppData = { workers: [], absences: [], takings: [] }
