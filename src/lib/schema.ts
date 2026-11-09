import { z } from 'zod'

export const workerFormSchema = z.object({
  nama: z.string().trim().min(1, 'Nama wajib diisi'),
  gajiBulanan: z
    .number({ error: 'Gaji bulanan wajib diisi' })
    .int('Gaji harus bilangan bulat')
    .positive('Gaji harus lebih dari 0'),
  tanggalMulai: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal mulai tidak valid'),
  aktif: z.boolean(),
  catatan: z.string().trim().max(200).optional().or(z.literal('')),
})

export type WorkerFormValues = z.infer<typeof workerFormSchema>

export const takingFormSchema = z.object({
  workerId: z.string().min(1, 'Pilih ART terlebih dahulu'),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  nominal: z
    .number({ error: 'Nominal wajib diisi' })
    .int('Nominal harus bilangan bulat')
    .positive('Nominal harus lebih dari 0'),
  jenis: z.enum(['kasbon', 'pelunasan']),
  keterangan: z.string().trim().max(200).optional().or(z.literal('')),
  metode: z.enum(['tunai', 'transfer', 'e-wallet']),
})

export type TakingFormValues = z.infer<typeof takingFormSchema>

/** Skema untuk file backup JSON (export/import). */
export const appDataSchema = z.object({
  workers: z.array(
    z.object({
      id: z.string(),
      nama: z.string(),
      gajiBulanan: z.number(),
      tanggalMulai: z.string(),
      aktif: z.boolean(),
      catatan: z.string().optional(),
    }),
  ),
  absences: z.array(
    z.object({
      id: z.string(),
      workerId: z.string(),
      tanggal: z.string(),
    }),
  ),
  takings: z.array(
    z.object({
      id: z.string(),
      workerId: z.string(),
      tanggal: z.string(),
      nominal: z.number(),
      jenis: z.enum(['kasbon', 'pelunasan']),
      keterangan: z.string(),
      metode: z.enum(['tunai', 'transfer', 'e-wallet']),
    }),
  ),
})
