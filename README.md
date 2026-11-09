# GajiART — Kalkulator Gaji & Kasbon ART

Aplikasi web mobile-friendly untuk menghitung gaji Asisten Rumah Tangga (ART)
yang bekerja setiap hari, dengan pencatatan kasbon (ambil gaji di muka) —
termasuk kasbon yang diambil **sebelum** hak gajinya terbentuk. Saldo negatif
otomatis terbawa sebagai hutang ke bulan berikutnya.

Tanpa login, tanpa backend, tanpa biaya server: semua data tersimpan lokal
di browser perangkat yang dipakai, dan bisa dibackup lewat export/import JSON.

## Fitur

- **Dashboard** — pemilih bulan, kartu per ART: hak gaji bulan ini, total
  diambil bulan ini, saldo kumulatif saat ini, dan chip status
  *Sisa hak / Lunas / Hutang*.
- **Data ART** — tambah / ubah / hapus ART: nama, gaji per bulan, tanggal
  mulai kerja, status aktif, catatan. Bisa banyak ART sekaligus.
- **Kehadiran** — kalender bulanan; ketuk tanggal untuk menandai tidak
  hadir. Hari lain otomatis dianggap hadir, jadi tidak perlu centang satu
  per satu.
- **Kasbon & Pengambilan** — catat setiap pengambilan uang: tanggal,
  nominal, jenis (*kasbon* = ambil di muka, *pelunasan* = bayar sisa gaji),
  metode (tunai / transfer / e-wallet), dan keterangan.
- **Rekap** — per ART & bulan: saldo awal (terbawa dari bulan sebelumnya),
  hak gaji bulan ini, total diambil, saldo akhir — plus tabel riwayat
  pengambilan lengkap.
- **Backup** — export data ke file JSON dan import kembali (tervalidasi,
  dengan konfirmasi sebelum mengganti data).

## Cara Hitung

1. **Gaji diinput per bulan.** Tarif harian = gaji bulanan ÷ jumlah hari
   kalender pada bulan tersebut.
   - November (30 hari): Rp2.000.000 ÷ 30 = Rp66.666,67/hari
   - Februari (28 hari): Rp2.000.000 ÷ 28 = Rp71.428,57/hari
   - Karena pembaginya mengikuti bulan itu, hadir penuh sebulan selalu pas
     sebesar gaji bulanan.
2. **Kehadiran bersifat biner:** hadir penuh / tidak hadir. Tidak ada
   setengah hari dan tidak ada lembur. Yang disimpan hanya tanggal tidak
   hadir; hari sejak tanggal mulai kerja sampai hari ini dianggap hadir.
   Tanggal masa depan dan tanggal sebelum mulai kerja tidak dihitung.
3. **Hak gaji (accrued) satu bulan** = gaji bulanan × hari hadir ÷ hari
   kalender bulan itu, dibulatkan ke rupiah penuh.
4. **Saldo bersifat kumulatif** = total hak gaji − total uang yang diambil.
   Saldo bulan berjalan = saldo awal + hak bulan ini − diambil bulan ini.

### Contoh: kasbon lebih besar dari hak gaji

Gaji Rp2.000.000/bulan, bulan November (30 hari), kasbon mingguan Rp500.000:

| Kejadian | Hak gaji terbentuk | Sudah diambil | Saldo |
| --- | ---: | ---: | ---: |
| Kerja 7 hari pertama (7 × Rp66.666,67) | Rp466.667 | Rp0 | Rp466.667 |
| Kasbon minggu pertama Rp500.000 | Rp466.667 | Rp500.000 | **−Rp33.333 (hutang)** |
| Kerja sampai akhir bulan (30 hari) | Rp2.000.000 | Rp500.000 | Rp1.500.000 |

Kalau di akhir bulan saldo masih negatif, angka negatif itu menjadi **saldo
awal bulan berikutnya** — hutangnya kepotong dari hak gaji bulan depan,
tidak hilang dan tidak perlu dicatat ulang.

## Tech Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript
- [TanStack Router](https://tanstack.com/router) — routing halaman
- [TanStack Query](https://tanstack.com/query) — pengelolaan state data
- [TanStack Form](https://tanstack.com/form) — form ART & pengambilan uang
- [TanStack Table](https://tanstack.com/table) — tabel riwayat rekap
  (sorting + pagination)
- [Tailwind CSS](https://tailwindcss.com) — styling mobile-first,
  navigasi bawah di layar kecil
- [Zod](https://zod.dev) — validasi form dan file backup
- [Vitest](https://vitest.dev) — unit test mesin hitung gaji
- Data: `localStorage` browser (tanpa backend)

## Menjalankan

Butuh Node.js 20+ (atau versi LTS terbaru).

```bash
npm install     # pasang dependensi
npm run dev     # server pengembangan (http://localhost:5173)
npm test        # unit test mesin hitung (Vitest)
npm run build   # build produksi ke folder dist/
npm run preview # pratinjau hasil build
```

## Deploy

Hasil `npm run build` adalah situs statis di folder `dist/` — bisa di-host
di mana saja:

- **Vercel / Netlify**: hubungkan repo ini, framework preset *Vite*,
  build command `npm run build`, output directory `dist`. Karena routing
  memakai TanStack Router (SPA), aktifkan fallback ke `index.html`
  (Vercel/Netlify biasanya otomatis untuk preset Vite; bila tidak, tambahkan
  rewrite `/* -> /index.html`).
- **GitHub Pages / hosting statis lain**: upload isi folder `dist/`.

> Catatan: data tersimpan per-perangkat di localStorage browser. Pindah
> perangkat = gunakan *Pengaturan → Unduh Backup JSON* di perangkat lama,
> lalu *Impor Backup JSON* di perangkat baru.

## Struktur Project

```
src/
├── main.tsx            # Router (TanStack Router), layout, navigasi bawah
├── components/
│   └── ui.tsx          # Komponen bersama: MonthNav, WorkerSelect, chip status
├── lib/
│   ├── types.ts        # Tipe data: Worker, Absence, Taking, AppData
│   ├── payroll.ts      # Mesin hitung gaji (fungsi murni)
│   ├── payroll.test.ts # Unit test mesin hitung
│   ├── schema.ts       # Skema Zod: form & backup JSON
│   ├── store.ts        # Persistensi localStorage + hook TanStack Query
│   └── format.ts       # Format Rupiah, tanggal, dan nama bulan (id-ID)
└── pages/
    ├── DashboardPage.tsx    # Ringkasan semua ART per bulan
    ├── ArtPage.tsx          # CRUD data ART
    ├── KehadiranPage.tsx    # Kalender ketidakhadiran
    ├── PengambilanPage.tsx  # Kasbon & pelunasan
    ├── RekapPage.tsx        # Rekap per ART + tabel riwayat
    └── PengaturanPage.tsx   # Export/import backup & reset
```

## Privasi

Aplikasi ini tidak mengirim data ke mana pun — tidak ada server, akun,
analitik, atau pelacak. Semua catatan gaji hanya ada di browser perangkatmu
(dan di file backup yang kamu unduh sendiri).
