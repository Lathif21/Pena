// Pemeriksaan perakit CSV. Escaping adalah hal yang diam-diam merusak data:
// satu nama bernama "Putri; Ayu" tanpa pembungkus akan menggeser seluruh kolom
// di baris itu, dan tidak ada yang menyadarinya sampai laporan salah dibaca.
//
// Jalankan: node scripts/cek-csv.mjs
import assert from 'node:assert/strict'
import { selSatu, keCsv, namaBerkas } from '../src/lib/utils/csv.js'

// --- Sel biasa --------------------------------------------------------------
assert.equal(selSatu('Budi'), 'Budi')
assert.equal(selSatu(85), '85')
assert.equal(selSatu(null), '')
assert.equal(selSatu(undefined), '')

// --- Yang wajib dibungkus ---------------------------------------------------
assert.equal(selSatu('Putri, Ayu'), '"Putri, Ayu"', 'koma harus dibungkus')
assert.equal(selSatu('Putri; Ayu'), 'Putri; Ayu', 'titik koma bukan pemisah lagi, jangan dibungkus')
assert.equal(selSatu('Ucap "hai"'), '"Ucap ""hai"""', 'kutip harus digandakan')
assert.equal(selSatu('baris\nbaru'), '"baris\nbaru"', 'baris baru harus dibungkus')

// --- Injeksi formula Excel --------------------------------------------------
// Sel yang diawali '=' dijalankan Excel saat file dibuka. Nama siswa berasal
// dari isian manusia, jadi ini bukan kemungkinan teoretis.
assert.equal(selSatu('=1+1'), "'=1+1")
// Nilai ini memuat tanda kutip, jadi setelah diberi pengaman formula ia juga
// dibungkus — pengamannya ada di dalam pembungkus, bukan di awal string.
assert.equal(
  selSatu('=HYPERLINK("http://jahat","klik")'),
  `"'=HYPERLINK(""http://jahat"",""klik"")"`
)
assert.equal(selSatu('@SUM(A1)'), "'@SUM(A1)")
assert.equal(selSatu('+62812'), "'+62812")
// Angka negatif TIDAK boleh diberi kutip — itu bilangan sah, dan kutipnya
// mengubah selnya jadi teks sehingga tidak bisa dijumlahkan.
assert.equal(selSatu(-5), '-5', 'angka negatif tetap angka')

// --- Rakitan lengkap --------------------------------------------------------
const kolom = [
  { kunci: 'nama', judul: 'Nama' },
  { kunci: 'nis', judul: 'NIS' },
  { kunci: 'rata', judul: 'Rata-rata' }
]
const csv = keCsv(
  [
    { nama: 'Budi', nis: '001', rata: 85 },
    { nama: 'Putri, Ayu', nis: '002', rata: null }
  ],
  kolom
)
assert.ok(csv.startsWith('﻿'), 'BOM wajib ada supaya Excel membaca UTF-8')
const baris = csv.replace('﻿', '').trimEnd().split('\r\n')
// Baris pengumuman pemisah. Tanpa ini Excel memakai pemisah dari locale
// Windows, dan pada mesin yang locale-nya tidak cocok seluruh baris menyatu
// jadi satu kolom — persis keluhan yang memicu perubahan ini.
assert.equal(baris[0], 'sep=,', 'baris sep= wajib jadi baris pertama setelah BOM')
assert.equal(baris.length, 4, 'sep= + judul + dua baris data')
assert.equal(baris[1], 'Nama,NIS,Rata-rata')
assert.equal(baris[2], 'Budi,001,85')
assert.equal(baris[3], '"Putri, Ayu",002,', 'nilai null jadi sel kosong, bukan "null"')
assert.ok(!csv.includes('null'), 'kata "null" tidak boleh muncul di file')

// Jumlah pemisah harus sama di setiap baris data — inilah yang rusak kalau
// escaping gagal, dan yang membuat kolom bergeser tanpa peringatan. Baris sep=
// dikecualikan karena ia memang bukan baris data.
for (const b of baris.slice(1)) {
  const diLuarKutip = b.replace(/"(?:[^"]|"")*"/g, '')
  assert.equal(
    (diLuarKutip.match(/,/g) || []).length,
    kolom.length - 1,
    `jumlah pemisah menyimpang: ${b}`
  )
}

// Nama kolom yang memuat koma juga harus dibungkus, kalau tidak baris judulnya
// bergeser sendiri dan seluruh tabel salah label.
const csvJudulKoma = keCsv([{ a: 1 }], [{ kunci: 'a', judul: 'Nilai, Rata-rata' }])
assert.ok(csvJudulKoma.includes('"Nilai, Rata-rata"'), 'judul berkoma harus dibungkus')

// --- Nama berkas ------------------------------------------------------------
assert.equal(namaBerkas('nilai-siswa', ['Reguler 3'], '2026-09-13'),
  'nilai-siswa_Reguler-3_2026-09-13.csv')
assert.equal(namaBerkas('nilai-siswa', [null, ''], '2026-09-13'),
  'nilai-siswa_2026-09-13.csv', 'filter kosong tidak menyisakan pemisah menggantung')
assert.equal(namaBerkas('nilai-siswa', ['Kelas 5/A'], '2026-09-13'),
  'nilai-siswa_Kelas-5-A_2026-09-13.csv', 'garis miring tidak boleh masuk nama berkas')

console.log('OK — perakit CSV')
