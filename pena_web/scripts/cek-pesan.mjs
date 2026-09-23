// Pemeriksaan penerjemah pesan error. Contoh errornya diambil dari respons
// Supabase yang sungguhan, bukan karangan.
//
// Jalankan: node scripts/cek-pesan.mjs
import assert from 'node:assert/strict'
import { pesanRamah, teknis } from '../src/lib/utils/pesan.js'

const tidakTeknis = (s) => assert.equal(teknis(s), false, `harusnya dianggap layak tampil: ${s}`)
const adalahTeknis = (s) => assert.equal(teknis(s), true, `harusnya dianggap teknis: ${s}`)

// --- Pesan buatan sendiri harus lewat apa adanya ----------------------------
// Endpoint proyek ini sudah menulis kalimat yang jelas; menerjemahkannya lagi
// hanya mengaburkan. Ini yang paling mudah rusak kalau daftar penanda ditambah
// sembarangan.
for (const p of [
  'Bukan sesi Anda',
  'Sesi sudah ditutup',
  'Anda tidak mengajar kelas ini',
  'Tanggal tidak boleh di masa lalu',
  'Task delegasi wajib diisi',
  'Isi file harus PDF',
  'Sudah ada relief aktif untuk kelas, mapel, dan tanggal ini',
  'Password minimal 8 karakter',
  'Akun tidak dikenali. Muat ulang halaman lalu coba lagi.',
  'Akun tidak ditemukan. Muat ulang halaman lalu coba lagi.',
  'Akun ini tidak punya data login. Hubungi pengelola aplikasi.',
  'Password sudah diganti, tapi akun ini belum dikeluarkan dari perangkat lain. Coba simpan sekali lagi.'
]) {
  tidakTeknis(p)
  assert.equal(pesanRamah(new Error(p)), p, `harus diteruskan utuh: ${p}`)
}

// --- Pesan Postgres yang sungguhan ------------------------------------------
adalahTeknis('null value in column "nama" of relation "kelas" violates not-null constraint')
adalahTeknis('new row for relation "kpi_config" violates check constraint "kpi_config_check"')
adalahTeknis('duplicate key value violates unique constraint "idx_relief_unik"')
adalahTeknis('permission denied for table relief')
adalahTeknis('JWSError JWSInvalidSignature')
adalahTeknis('')
adalahTeknis(undefined)

// Kode error diprioritaskan di atas teks, karena lebih pasti.
assert.equal(pesanRamah({ code: '23502', message: 'null value in column "nama"...' }),
  'Ada kolom wajib yang belum diisi.')
assert.equal(pesanRamah({ code: '23505', message: 'duplicate key ...' }),
  'Data ini sudah ada. Periksa apakah sudah pernah dibuat sebelumnya.')
assert.equal(pesanRamah({ code: '23514', message: 'violates check constraint' }),
  'Nilai yang dimasukkan tidak memenuhi aturan yang berlaku.')
assert.equal(pesanRamah({ code: '23503', message: 'violates foreign key constraint' }),
  'Data yang dirujuk tidak ditemukan atau sudah dihapus.')

// --- Pesan Supabase Auth (bahasa Inggris, tidak bisa diubah di sana) --------
assert.equal(pesanRamah(new Error('Invalid login credentials')), 'Email atau password salah.')
assert.equal(pesanRamah(new Error('User already registered')), 'Email ini sudah terpakai.')
assert.equal(pesanRamah(new Error('Password should be at least 6 characters')),
  'Password minimal 8 karakter.')
assert.ok(pesanRamah(new Error('Invalid API key')).includes('Hubungi pengelola'),
  'kesalahan konfigurasi tidak boleh terlihat seperti kesalahan pengguna')
assert.ok(pesanRamah(new Error('TypeError: Failed to fetch')).includes('koneksi'),
  'gangguan jaringan harus menyarankan memeriksa koneksi')

// --- Cadangan ---------------------------------------------------------------
assert.equal(
  pesanRamah(new Error('relation "x" does not exist'), 'Gagal menyimpan kelas.'),
  'Gagal menyimpan kelas.'
)
assert.equal(pesanRamah(null, 'Gagal memuat data.'), 'Gagal memuat data.')
// Tanpa cadangan pun tidak boleh mengembalikan string kosong.
assert.ok(pesanRamah(null).length > 10)

// Tidak boleh ada istilah database yang lolos ke pengguna.
for (const err of [
  { code: '23505', message: 'duplicate key value violates unique constraint "x"' },
  new Error('null value in column "nama" of relation "kelas" violates not-null constraint'),
  new Error('permission denied for table sesi_mengajar')
]) {
  const hasil = pesanRamah(err, 'Gagal menyimpan.')
  for (const kata of ['constraint', 'relation', 'column', 'null value', 'permission denied']) {
    assert.ok(!hasil.includes(kata), `"${kata}" masih lolos ke pengguna: ${hasil}`)
  }
}

console.log('OK — penerjemah pesan error')
