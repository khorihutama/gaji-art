import { describe, expect, it } from 'vitest'
import type { Taking, Worker } from './types'
import {
  accruedForMonth,
  accruedThrough,
  balanceThrough,
  dailyRate,
  daysInMonth,
  monthlySummary,
  presentDaysInMonth,
} from './payroll'

const worker = (over: Partial<Worker> = {}): Worker => ({
  id: 'w1',
  nama: 'Sari',
  gajiBulanan: 2_000_000,
  tanggalMulai: '2026-11-01',
  aktif: true,
  ...over,
})

const taking = (over: Partial<Taking> = {}): Taking => ({
  id: 't1',
  workerId: 'w1',
  tanggal: '2026-11-05',
  nominal: 500_000,
  jenis: 'kasbon',
  keterangan: 'Kasbon mingguan',
  metode: 'tunai',
  ...over,
})

const NOV = { year: 2026, month: 11 }
const noAbsence = new Set<string>()

describe('hari kalender & tarif harian', () => {
  it('November 2026 punya 30 hari, Februari 2026 punya 28 hari', () => {
    expect(daysInMonth(2026, 11)).toBe(30)
    expect(daysInMonth(2026, 2)).toBe(28)
  })

  it('tarif harian Februari memakai pembagi 28', () => {
    expect(dailyRate(worker(), { year: 2026, month: 2 })).toBeCloseTo(2_000_000 / 28)
    // 1 hari hadir di Februari 2026
    const feb = worker({ tanggalMulai: '2026-02-01' })
    expect(accruedForMonth(feb, noAbsence, { year: 2026, month: 2 }, '2026-02-01')).toBe(71_429)
    // 14 hari hadir = tepat setengah gaji bulanan
    expect(accruedThrough(feb, noAbsence, '2026-02-14')).toBe(1_000_000)
  })
})

describe('hak gaji November 2026 (gaji Rp2.000.000, 30 hari)', () => {
  it('7 hari hadir pertama = Rp466.667', () => {
    expect(presentDaysInMonth(worker(), noAbsence, NOV, '2026-11-07')).toBe(7)
    expect(accruedThrough(worker(), noAbsence, '2026-11-07')).toBe(466_667)
  })

  it('kasbon Rp500.000 setelah 7 hari kerja -> saldo -Rp33.333 (hutang)', () => {
    const saldo = balanceThrough(worker(), noAbsence, [taking()], '2026-11-07')
    expect(saldo).toBe(-33_333)
  })

  it('hadir penuh sebulan = tepat Rp2.000.000', () => {
    expect(accruedForMonth(worker(), noAbsence, NOV, '2026-11-30')).toBe(2_000_000)
    expect(accruedThrough(worker(), noAbsence, '2026-11-30')).toBe(2_000_000)
  })

  it('satu hari tidak hadir mengurangi hak gaji satu tarif harian', () => {
    const absent = new Set(['2026-11-03'])
    expect(presentDaysInMonth(worker(), absent, NOV, '2026-11-07')).toBe(6)
    expect(accruedThrough(worker(), absent, '2026-11-07')).toBe(400_000)
    expect(accruedForMonth(worker(), absent, NOV, '2026-11-30')).toBe(1_933_333)
  })

  it('tanggal masa depan & sebelum mulai kerja tidak dihitung', () => {
    expect(accruedThrough(worker(), noAbsence, '2026-10-31')).toBe(0)
    // asOf di awal bulan: hanya sampai tanggal itu yang terhitung
    expect(accruedThrough(worker(), noAbsence, '2026-11-01')).toBe(66_667)
  })
})

describe('carry-over hutang antar bulan', () => {
  it('saldo negatif akhir November menjadi saldo awal negatif Desember', () => {
    // Mulai 24 Nov: 7 hari hadir s/d 30 Nov = Rp466.667, kasbon Rp500.000.
    const w = worker({ tanggalMulai: '2026-11-24' })
    const takings = [taking({ tanggal: '2026-11-30' })]

    const nov = monthlySummary(w, noAbsence, takings, NOV, '2026-11-30')
    expect(nov.accrued).toBe(466_667)
    expect(nov.taken).toBe(500_000)
    expect(nov.closingBalance).toBe(-33_333)

    const des = monthlySummary(w, noAbsence, takings, { year: 2026, month: 12 }, '2026-12-31')
    expect(des.openingBalance).toBe(-33_333)
    // Desember 31 hari hadir penuh = Rp2.000.000, dikurangi hutang terbawa
    expect(des.accrued).toBe(2_000_000)
    expect(des.closingBalance).toBe(1_966_667)
  })

  it('rekap bulan berjalan hanya mengakui hak sampai hari ini (asOf)', () => {
    const s = monthlySummary(worker(), noAbsence, [taking()], NOV, '2026-11-07')
    expect(s.openingBalance).toBe(0)
    expect(s.accrued).toBe(466_667)
    expect(s.taken).toBe(500_000)
    expect(s.closingBalance).toBe(-33_333)
    expect(s.presentDays).toBe(7)
  })
})
