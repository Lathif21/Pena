/**
 * KPI tentor — DATA CONTOH, bukan hasil hitungan.
 *
 * Fase 5 yang membangun KPI sungguhan (bobot, sumber, konfigurasi oleh kepala
 * guru). Sampai itu ada, dashboard menampilkan baris di bawah ini apa adanya.
 *
 * Nama sengaja fiktif, bukan diambil dari tabel profiles. Angka palsu yang
 * menempel pada nama tentor asli akan terbaca sebagai penilaian sungguhan —
 * dan itu penilaian yang tidak pernah dihitung siapa pun.
 *
 * Saat Fase 5 dikerjakan: ganti modul ini dengan query, jangan menambah kolom
 * di sini.
 */
export interface KpiTentor {
  nama: string
  kehadiran: number
  jurnal: number
  rataNilaiSiswa: number
  skor: number
}

export const kpiContoh: KpiTentor[] = [
  { nama: 'Tentor A', kehadiran: 96, jurnal: 92, rataNilaiSiswa: 84, skor: 91 },
  { nama: 'Tentor B', kehadiran: 88, jurnal: 80, rataNilaiSiswa: 79, skor: 82 },
  { nama: 'Tentor C', kehadiran: 92, jurnal: 100, rataNilaiSiswa: 81, skor: 90 },
  { nama: 'Tentor D', kehadiran: 74, jurnal: 65, rataNilaiSiswa: 72, skor: 70 },
  { nama: 'Tentor E', kehadiran: 98, jurnal: 95, rataNilaiSiswa: 88, skor: 94 }
]
