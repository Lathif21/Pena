/**
 * Menerjemahkan error teknis jadi pesan yang layak dibaca pengguna.
 *
 * Tanpa ini, kegagalan database sampai ke layar apa adanya — misalnya
 * `null value in column "nama" of relation "kelas" violates not-null
 * constraint`. Bagi tentor atau kepala guru itu bukan informasi, hanya
 * kebisingan yang membuat mereka mengira aplikasinya rusak.
 *
 * Pesan buatan sendiri dibiarkan lewat apa adanya: endpoint di proyek ini sudah
 * menulis kalimat Indonesia yang jelas ("Bukan sesi Anda", "Sesi sudah
 * ditutup"), dan menerjemahkannya lagi hanya akan mengaburkannya.
 *
 * Sengaja .js polos supaya scripts/cek-pesan.mjs mengimpor fungsi yang sama.
 */

/** Penanda bahwa sebuah pesan berasal dari Postgres/PostgREST, bukan dari kita. */
const PENANDA_TEKNIS = [
  'violates',
  'constraint',
  'relation "',
  'column "',
  'duplicate key',
  'syntax error',
  'permission denied',
  'pgrst',
  'jwt',
  'jws',
  'invalid input syntax',
  'failed to fetch',
  'fetch failed',
  'networkerror',
  'invalid api key',
  'infinite recursion'
]

// Dicocokkan tanpa peduli huruf besar-kecil: Supabase mengirim 'JWSError' dan
// 'jwt expired' dengan kapitalisasi yang berbeda-beda, dan mendaftar setiap
// variannya satu per satu hanya menunggu varian berikutnya lolos.
export function teknis(pesan) {
  if (typeof pesan !== 'string' || pesan.trim() === '') return true
  const l = pesan.toLowerCase()
  return PENANDA_TEKNIS.some((p) => l.includes(p))
}

/** Kode error Postgres yang paling sering terlihat pengguna. */
const PER_KODE = {
  '23502': 'Ada kolom wajib yang belum diisi.',
  '23503': 'Data yang dirujuk tidak ditemukan atau sudah dihapus.',
  '23505': 'Data ini sudah ada. Periksa apakah sudah pernah dibuat sebelumnya.',
  '23514': 'Nilai yang dimasukkan tidak memenuhi aturan yang berlaku.',
  '22P02': 'Format data tidak sesuai.',
  '42501': 'Anda tidak punya izin untuk tindakan ini.',
  PGRST116: 'Data yang dicari tidak ditemukan.'
}

/** Pesan dari Supabase Auth, yang bahasanya Inggris dan tidak bisa diubah. */
const PER_TEKS = [
  [/invalid login credentials/i, 'Email atau password salah.'],
  [/email not confirmed/i, 'Email ini belum dikonfirmasi. Hubungi kepala guru.'],
  [/user already registered|already been registered/i, 'Email ini sudah terpakai.'],
  [/password should be at least/i, 'Password minimal 8 karakter.'],
  [/invalid api key|jwt|jwks/i, 'Konfigurasi server bermasalah. Hubungi pengelola aplikasi.'],
  [/failed to fetch|fetch failed|networkerror/i, 'Tidak bisa menghubungi server. Periksa koneksi Anda, lalu coba lagi.'],
  [/rate limit|too many requests/i, 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'],
  [/duplicate key/i, 'Data ini sudah ada. Periksa apakah sudah pernah dibuat sebelumnya.']
]

/**
 * @param {unknown} err error apa pun — Error, objek PostgREST, atau string
 * @param {string} cadangan kalimat yang dipakai kalau errornya tidak dikenali
 * @returns {string} kalimat berbahasa Indonesia, tanpa istilah database
 */
export function pesanRamah(err, cadangan = 'Terjadi kesalahan. Coba lagi sebentar.') {
  const obj = /** @type {any} */ (err)
  const teks = typeof err === 'string' ? err : (obj?.message ?? '')
  const kode = obj?.code

  if (kode && PER_KODE[kode]) return PER_KODE[kode]

  for (const [pola, ramah] of PER_TEKS) {
    if (pola.test(teks)) return ramah
  }

  // Pesan buatan sendiri sudah jelas — lewatkan. Yang teknis diganti cadangan.
  return teknis(teks) ? cadangan : teks
}
