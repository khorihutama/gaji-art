import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { emptyData, type AppData } from './types'
import { appDataSchema } from './schema'

const STORAGE_KEY = 'gaji-art:data:v1'
export const DATA_QUERY_KEY = ['app-data'] as const

/** Baca data dari localStorage; data rusak/tidak valid -> data kosong. */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData
    const parsed = appDataSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : emptyData
  } catch {
    return emptyData
  }
}

function persist(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Penyimpanan penuh/ditolak browser: abaikan, data tetap di memori sesi ini.
  }
}

/** Data aplikasi (workers, absences, takings) — sumber kebenaran tunggal. */
export function useAppData(): AppData {
  const { data } = useQuery({
    queryKey: DATA_QUERY_KEY,
    queryFn: loadData,
    staleTime: Infinity,
    gcTime: Infinity,
  })
  return data ?? emptyData
}

/** Kembalikan fungsi update: terapkan perubahan, simpan ke localStorage, segarkan cache Query. */
export function useUpdateData() {
  const queryClient = useQueryClient()
  return (updater: (current: AppData) => AppData) => {
    const current = queryClient.getQueryData<AppData>(DATA_QUERY_KEY) ?? loadData()
    const next = updater(current)
    persist(next)
    queryClient.setQueryData(DATA_QUERY_KEY, next)
    return next
  }
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** State kecil yang ikut tersimpan di localStorage (pilihan ART & bulan antar halaman). */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // abaikan
    }
  }, [key, value])
  return [value, setValue] as const
}
