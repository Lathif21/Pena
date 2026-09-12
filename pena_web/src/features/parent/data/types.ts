/**
 * Tipe bersama untuk fitur wali murid.
 *
 * Terpisah dari anak.server.ts supaya komponen klien tidak perlu mengimpor
 * modul server hanya untuk tipenya. `import type` memang dihapus saat kompilasi,
 * tapi impor yang terlihat menunjuk ke .server.ts mengundang seseorang
 * menambahkan impor nilai di sana suatu hari.
 */
export interface Anak {
  siswaDetailId: string
  nama: string
  nis: string
  kelasNama: string
  paket: string
}

export interface Titik {
  judul: string
  nilai: number
  tanggal: string | null
  sumber: 'try_out' | 'manual'
}

export interface NilaiAnak {
  perMapel: { mapelId: string; nama: string; rata: number | null; nilai: Titik[] }[]
  rataKeseluruhan: number | null
  jumlah: number
}

export interface KehadiranAnak {
  total: number
  hadir: number
  persen: number | null
  baris: {
    id: string
    tanggal: string | null
    kelasNama: string
    mapelNama: string
    tentorNama: string
    hadir: boolean
  }[]
}
