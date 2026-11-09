import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import type { Worker } from '../lib/types'
import { workerFormSchema, type WorkerFormValues } from '../lib/schema'
import { newId, useAppData, useUpdateData } from '../lib/store'
import { formatRupiah, formatTanggal } from '../lib/format'
import { todayStr } from '../lib/payroll'
import {
  EmptyState,
  FieldError,
  ghostBtn,
  inputClass,
  labelClass,
  primaryBtn,
} from '../components/ui'

function WorkerForm({
  initial,
  onDone,
}: {
  initial: Worker | null
  onDone: () => void
}) {
  const updateData = useUpdateData()

  const form = useForm({
    defaultValues: {
      nama: initial?.nama ?? '',
      gajiBulanan: initial?.gajiBulanan ?? 0,
      tanggalMulai: initial?.tanggalMulai ?? todayStr(),
      aktif: initial?.aktif ?? true,
      catatan: initial?.catatan ?? '',
    } as WorkerFormValues,
    validators: { onChange: workerFormSchema },
    onSubmit: ({ value }) => {
      const worker: Worker = {
        id: initial?.id ?? newId(),
        nama: value.nama.trim(),
        gajiBulanan: value.gajiBulanan,
        tanggalMulai: value.tanggalMulai,
        aktif: value.aktif,
        catatan: value.catatan?.trim() ? value.catatan.trim() : undefined,
      }
      updateData((d) => ({
        ...d,
        workers: initial
          ? d.workers.map((w) => (w.id === initial.id ? worker : w))
          : [...d.workers, worker],
      }))
      onDone()
    },
  })

  return (
    <form
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <h2 className="font-bold">{initial ? 'Ubah ART' : 'Tambah ART'}</h2>

      <form.Field name="nama">
        {(field) => (
          <div>
            <label className={labelClass} htmlFor="f-nama">Nama</label>
            <input
              id="f-nama"
              className={inputClass}
              placeholder="Contoh: Sari"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field name="gajiBulanan">
        {(field) => (
          <div>
            <label className={labelClass} htmlFor="f-gaji">Gaji per bulan (Rp)</label>
            <input
              id="f-gaji"
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Contoh: 2000000"
              value={field.state.value || ''}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.valueAsNumber || 0)}
            />
            {field.state.value > 0 && (
              <p className="mt-1 text-sm text-stone-500">{formatRupiah(field.state.value)} / bulan</p>
            )}
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field name="tanggalMulai">
        {(field) => (
          <div>
            <label className={labelClass} htmlFor="f-mulai">Tanggal mulai kerja</label>
            <input
              id="f-mulai"
              className={inputClass}
              type="date"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field name="catatan">
        {(field) => (
          <div>
            <label className={labelClass} htmlFor="f-catatan">Catatan (opsional)</label>
            <input
              id="f-catatan"
              className={inputClass}
              placeholder="Contoh: pulang kampung tiap Lebaran"
              value={field.state.value ?? ''}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field name="aktif">
        {(field) => (
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              className="h-5 w-5 accent-emerald-700"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
            />
            Masih aktif bekerja
          </label>
        )}
      </form.Field>

      <div className="flex gap-2 pt-1">
        <button type="submit" className={`${primaryBtn} flex-1`}>
          Simpan
        </button>
        <button type="button" className={ghostBtn} onClick={onDone}>
          Batal
        </button>
      </div>
    </form>
  )
}

export default function ArtPage() {
  const data = useAppData()
  const updateData = useUpdateData()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Worker | null>(null)

  const hapus = (w: Worker) => {
    if (
      window.confirm(
        `Hapus ${w.nama}? Data kehadiran dan pengambilan uang miliknya juga ikut terhapus.`,
      )
    ) {
      updateData((d) => ({
        workers: d.workers.filter((x) => x.id !== w.id),
        absences: d.absences.filter((x) => x.workerId !== w.id),
        takings: d.takings.filter((x) => x.workerId !== w.id),
      }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Data ART</h1>
        {!formOpen && (
          <button
            className={primaryBtn}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            + Tambah ART
          </button>
        )}
      </div>

      {formOpen && (
        <WorkerForm
          key={editing?.id ?? 'baru'}
          initial={editing}
          onDone={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      {data.workers.length === 0 && !formOpen ? (
        <EmptyState title="Belum ada data ART">
          Tambahkan ART pertama lewat tombol “+ Tambah ART” di atas — isi nama,
          gaji per bulan, dan tanggal mulai kerjanya.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {data.workers.map((w) => (
            <li key={w.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">
                    {w.nama}{' '}
                    {!w.aktif && (
                      <span className="ml-1 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">
                        Nonaktif
                      </span>
                    )}
                  </p>
                  <p className="money mt-0.5 text-sm text-stone-600">
                    {formatRupiah(w.gajiBulanan)} / bulan
                  </p>
                  <p className="text-sm text-stone-500">
                    Mulai kerja: {formatTanggal(w.tanggalMulai)}
                  </p>
                  {w.catatan && <p className="mt-1 text-sm text-stone-500">📝 {w.catatan}</p>}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className={`${ghostBtn} flex-1`}
                  onClick={() => {
                    setEditing(w)
                    setFormOpen(true)
                  }}
                >
                  Ubah
                </button>
                <button
                  className="flex-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 active:bg-red-50"
                  onClick={() => hapus(w)}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
