import { useRef, useState } from 'react'
import { emptyData } from '../lib/types'
import { appDataSchema } from '../lib/schema'
import { useAppData, useUpdateData } from '../lib/store'
import { todayStr } from '../lib/payroll'
import { ghostBtn, primaryBtn } from '../components/ui'

export default function PengaturanPage() {
  const data = useAppData()
  const updateData = useUpdateData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null)

  const ekspor = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gaji-art-backup-${todayStr().replaceAll('-', '')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setPesan({ ok: true, teks: 'File backup berhasil diunduh.' })
  }

  const impor = async (file: File) => {
    try {
      const parsed = appDataSchema.safeParse(JSON.parse(await file.text()))
      if (!parsed.success) {
        setPesan({
          ok: false,
          teks: 'File tidak valid — format backup tidak sesuai. Data saat ini tidak berubah.',
        })
        return
      }
      if (
        window.confirm(
          'Impor backup ini? SEMUA data saat ini akan diganti dengan isi file backup.',
        )
      ) {
        updateData(() => parsed.data)
        setPesan({ ok: true, teks: 'Backup berhasil diimpor. Data sudah diganti.' })
      }
    } catch {
      setPesan({
        ok: false,
        teks: 'File tidak bisa dibaca (bukan JSON yang valid). Data saat ini tidak berubah.',
      })
    }
  }

  const reset = () => {
    if (
      window.confirm('Hapus SEMUA data (ART, kehadiran, pengambilan)?') &&
      window.confirm('Yakin? Tindakan ini tidak bisa dibatalkan. Unduh backup dulu bila perlu.')
    ) {
      updateData(() => emptyData)
      setPesan({ ok: true, teks: 'Semua data sudah dihapus.' })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Pengaturan & Backup</h1>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">Data tersimpan di perangkat ini</h2>
        <p className="mt-1 text-sm leading-relaxed text-stone-500">
          Aplikasi ini tanpa login dan tanpa server: data tersimpan di
          penyimpanan lokal browser (localStorage) pada perangkat yang
          dipakai. Saat ini ada {data.workers.length} ART, {data.absences.length}{' '}
          catatan tidak hadir, dan {data.takings.length} catatan pengambilan
          uang. Unduh backup secara berkala — bila cache browser dibersihkan,
          data ikut terhapus.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">Backup (Export / Import)</h2>
        <div className="flex flex-wrap gap-2">
          <button className={primaryBtn} onClick={ekspor}>
            ⬇️ Unduh Backup JSON
          </button>
          <button className={ghostBtn} onClick={() => fileRef.current?.click()}>
            ⬆️ Impor Backup JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void impor(f)
              e.target.value = ''
            }}
          />
        </div>
        <p className="text-sm text-stone-500">
          Impor akan mengganti seluruh data saat ini setelah kamu konfirmasi.
        </p>
        {pesan && (
          <p
            className={`rounded-xl px-3 py-2 text-sm ${
              pesan.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {pesan.teks}
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">Cara hitung (ringkas)</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-stone-600">
          <li>Tarif harian = gaji bulanan ÷ jumlah hari kalender bulan itu.</li>
          <li>Hari sejak mulai kerja dianggap hadir, kecuali yang ditandai tidak hadir.</li>
          <li>Saldo = total hak gaji − total uang yang sudah diambil (kasbon + pelunasan).</li>
          <li>Saldo negatif di akhir bulan otomatis menjadi hutang di bulan berikutnya.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
        <h2 className="font-bold text-red-700">Zona berbahaya</h2>
        <p className="mt-1 text-sm text-stone-500">
          Hapus seluruh data dari perangkat ini dan mulai dari kosong.
        </p>
        <button
          className="mt-3 rounded-xl border border-red-300 bg-white px-4 py-2.5 font-semibold text-red-600 active:bg-red-50"
          onClick={reset}
        >
          Hapus Semua Data
        </button>
      </section>
    </div>
  )
}
