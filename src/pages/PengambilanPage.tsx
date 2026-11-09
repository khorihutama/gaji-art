import { useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import type { Taking } from '../lib/types'
import { takingFormSchema, type TakingFormValues } from '../lib/schema'
import { newId, useAppData, usePersistentState, useUpdateData } from '../lib/store'
import { todayStr } from '../lib/payroll'
import { JENIS_LABEL, METODE_LABEL, formatRupiah, formatTanggal } from '../lib/format'
import {
  EmptyState,
  FieldError,
  ghostBtn,
  inputClass,
  labelClass,
  primaryBtn,
} from '../components/ui'

function TakingForm({
  initial,
  defaultWorkerId,
  onDone,
}: {
  initial: Taking | null
  defaultWorkerId: string
  onDone: () => void
}) {
  const data = useAppData()
  const updateData = useUpdateData()

  const form = useForm({
    defaultValues: {
      workerId: initial?.workerId ?? defaultWorkerId,
      tanggal: initial?.tanggal ?? todayStr(),
      nominal: initial?.nominal ?? 0,
      jenis: initial?.jenis ?? 'kasbon',
      keterangan: initial?.keterangan ?? '',
      metode: initial?.metode ?? 'tunai',
    } as TakingFormValues,
    validators: { onChange: takingFormSchema },
    onSubmit: ({ value }) => {
      const taking: Taking = {
        id: initial?.id ?? newId(),
        workerId: value.workerId,
        tanggal: value.tanggal,
        nominal: value.nominal,
        jenis: value.jenis,
        keterangan: value.keterangan?.trim() ?? '',
        metode: value.metode,
      }
      updateData((d) => ({
        ...d,
        takings: initial
          ? d.takings.map((t) => (t.id === initial.id ? taking : t))
          : [...d.takings, taking],
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
      <h2 className="font-bold">{initial ? 'Ubah Pengambilan' : 'Catat Pengambilan Uang'}</h2>

      <form.Field name="workerId">
        {(field) => (
          <div>
            <label className={labelClass} htmlFor="t-art">ART</label>
            <select
              id="t-art"
              className={inputClass}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            >
              {data.workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nama}
                </option>
              ))}
            </select>
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="tanggal">
          {(field) => (
            <div>
              <label className={labelClass} htmlFor="t-tanggal">Tanggal</label>
              <input
                id="t-tanggal"
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
        <form.Field name="nominal">
          {(field) => (
            <div>
              <label className={labelClass} htmlFor="t-nominal">Nominal (Rp)</label>
              <input
                id="t-nominal"
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="500000"
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.valueAsNumber || 0)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="jenis">
        {(field) => (
          <div>
            <span className={labelClass}>Jenis</span>
            <div className="grid grid-cols-2 gap-2">
              {(['kasbon', 'pelunasan'] as const).map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => field.handleChange(j)}
                  className={`rounded-xl border px-3 py-2.5 font-medium ${
                    field.state.value === j
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                      : 'border-stone-300 bg-white text-stone-600'
                  }`}
                >
                  {JENIS_LABEL[j]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Kasbon = ambil uang di muka. Pelunasan = pembayaran sisa gaji.
            </p>
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="metode">
          {(field) => (
            <div>
              <label className={labelClass} htmlFor="t-metode">Metode</label>
              <select
                id="t-metode"
                className={inputClass}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value as TakingFormValues['metode'])
                }
              >
                <option value="tunai">Tunai</option>
                <option value="transfer">Transfer</option>
                <option value="e-wallet">E-wallet</option>
              </select>
            </div>
          )}
        </form.Field>
        <form.Field name="keterangan">
          {(field) => (
            <div>
              <label className={labelClass} htmlFor="t-ket">Keterangan</label>
              <input
                id="t-ket"
                className={inputClass}
                placeholder="Kasbon mingguan"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>

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

export default function PengambilanPage() {
  const data = useAppData()
  const updateData = useUpdateData()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Taking | null>(null)
  const [filterWorker, setFilterWorker] = usePersistentState('gaji-art:workerId', '')

  const workerName = (id: string) => data.workers.find((w) => w.id === id)?.nama ?? '—'

  const visible = useMemo(() => {
    const sorted = [...data.takings].sort((a, b) =>
      a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0,
    )
    const validFilter = data.workers.some((w) => w.id === filterWorker)
    return validFilter ? sorted.filter((t) => t.workerId === filterWorker) : sorted
  }, [data.takings, data.workers, filterWorker])

  if (data.workers.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Kasbon & Pengambilan</h1>
        <EmptyState title="Belum ada data ART">
          Tambahkan data ART dulu sebelum mencatat kasbon.{' '}
          <Link to="/art" className="font-semibold text-emerald-700 underline">
            Ke halaman ART →
          </Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Kasbon & Pengambilan</h1>
        {!formOpen && (
          <button
            className={primaryBtn}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            + Catat
          </button>
        )}
      </div>

      {formOpen && (
        <TakingForm
          key={editing?.id ?? 'baru'}
          initial={editing}
          defaultWorkerId={
            data.workers.some((w) => w.id === filterWorker)
              ? filterWorker
              : data.workers[0].id
          }
          onDone={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      <div>
        <label className={labelClass} htmlFor="filter-art">Tampilkan milik</label>
        <select
          id="filter-art"
          className={inputClass}
          value={data.workers.some((w) => w.id === filterWorker) ? filterWorker : ''}
          onChange={(e) => setFilterWorker(e.target.value)}
        >
          <option value="">Semua ART</option>
          {data.workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.nama}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Belum ada pengambilan uang">
          Setiap ART mengambil kasbon atau menerima pelunasan, catat di sini
          lewat tombol “+ Catat”.
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {visible.map((t) => (
            <li key={t.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {workerName(t.workerId)}{' '}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        t.jenis === 'kasbon'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {JENIS_LABEL[t.jenis]}
                    </span>
                  </p>
                  <p className="text-sm text-stone-500">
                    {formatTanggal(t.tanggal)} · {METODE_LABEL[t.metode]}
                    {t.keterangan ? ` · ${t.keterangan}` : ''}
                  </p>
                </div>
                <p className="money font-bold">{formatRupiah(t.nominal)}</p>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  className={`${ghostBtn} flex-1`}
                  onClick={() => {
                    setEditing(t)
                    setFormOpen(true)
                  }}
                >
                  Ubah
                </button>
                <button
                  className="flex-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 active:bg-red-50"
                  onClick={() => {
                    if (window.confirm('Hapus catatan pengambilan ini?')) {
                      updateData((d) => ({
                        ...d,
                        takings: d.takings.filter((x) => x.id !== t.id),
                      }))
                    }
                  }}
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
