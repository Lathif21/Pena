/**
 * Aturan kode lupa password, dipisah dari query supaya bisa diperiksa tanpa
 * database. Sengaja .js polos supaya scripts/cek-reset-password.mjs mengimpor
 * fungsi yang sama.
 *
 * Kode 6 angka hanya punya sejuta kemungkinan, jadi batasnya berlapis: 5 tebakan
 * per kode dan 5 kode per 24 jam — paling banyak 25 tebakan sehari per akun.
 */

export const MENIT_BERLAKU = 60
export const MAKS_PERCOBAAN = 5
export const MAKS_PER_HARI = 5
const JEDA_MS = 60_000
const SEHARI_MS = 86_400_000

/**
 * @param {string[]} riwayat created_at kode milik akun ini
 * @param {number} sekarang epoch ms
 * @returns {string | null} alasan menolak kode baru, atau null kalau boleh
 */
export function tolakPermintaan(riwayat, sekarang) {
  const umur = riwayat.map((r) => sekarang - new Date(r).getTime()).filter((u) => u < SEHARI_MS)

  if (umur.length >= MAKS_PER_HARI) {
    return 'Sudah 5 kali minta kode dalam 24 jam. Coba lagi besok, atau minta kepala guru mengganti password Anda.'
  }
  if (umur.some((u) => u < JEDA_MS)) {
    return 'Kode baru saja dikirim. Tunggu 1 menit sebelum minta kode baru.'
  }
  return null
}

/**
 * @param {{ percobaan: number, expires_at: string, used_at: string | null } | null} kode
 *   kode terbaru milik akun ini
 * @param {number} sekarang epoch ms
 * @returns {string | null} alasan kode tidak bisa dipakai, atau null kalau boleh dicoba
 */
export function tolakKode(kode, sekarang) {
  if (!kode || kode.used_at || new Date(kode.expires_at).getTime() <= sekarang) {
    return 'Kode tidak berlaku atau sudah kedaluwarsa. Minta kode baru.'
  }
  if (kode.percobaan >= MAKS_PERCOBAAN) {
    return 'Terlalu banyak percobaan salah. Minta kode baru.'
  }
  return null
}
