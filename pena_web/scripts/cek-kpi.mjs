// Pemeriksaan rumus KPI. Angkanya diambil dari tabel kasus uji di
// docs/fase-5-execution.md Langkah 0d, jadi ini menguji rumus terhadap contoh
// yang sudah disepakati — bukan terhadap dugaan saya sendiri.
//
// Jalankan: node scripts/cek-kpi.mjs
import assert from 'node:assert/strict'
import {
  normalizedGain,
  gainTentor,
  kelengkapanJurnal,
  skorKpi
} from '../src/features/kpi/data/hitung.js'

const dekat = (a, b, pesan) =>
  assert.ok(Math.abs(a - b) < 0.005, `${pesan}: ${a} != ${b}`)

// --- Tabel kasus uji dari panduan --------------------------------------------
// Siswa 1 dan 4 punya kenaikan mentah jauh berbeda (+20 vs +5) tapi gain SAMA.
// Inilah seluruh alasan Normalized Gain dipakai; kalau ini gagal, rumusnya
// kembali menghukum tentor yang mengajar siswa bernilai tinggi.
dekat(normalizedGain(40, 60), 0.3333, 'siswa 1')
dekat(normalizedGain(55, 70), 0.3333, 'siswa 2')
dekat(normalizedGain(70, 82), 0.4, 'siswa 3')
dekat(normalizedGain(85, 90), 0.3333, 'siswa 4')
assert.equal(
  normalizedGain(40, 60).toFixed(4),
  normalizedGain(85, 90).toFixed(4),
  'kenaikan +20 dari 40 harus setara +5 dari 85'
)

// --- Kasus tepi yang diwajibkan kpi.md ---------------------------------------
assert.equal(normalizedGain(100, 100), null, 'pre=100 dikecualikan, bukan 0')
assert.equal(normalizedGain(100, 60), null, 'pre=100 tetap dikecualikan')
assert.equal(normalizedGain(50, null), null, 'tanpa post dikecualikan')
assert.equal(normalizedGain(null, 80), null, 'tanpa pre dikecualikan')
assert.ok(normalizedGain(70, 50) < 0, 'post < pre harus negatif, jangan dijepit ke nol')

// Rata-rata tentor: empat siswa tabel + satu tanpa post + satu pre=100.
// Keduanya harus keluar dari rata-rata tapi tetap terhitung sebagai dikecualikan.
const t = gainTentor([
  { pre: 40, post: 60 },
  { pre: 55, post: 70 },
  { pre: 70, post: 82 },
  { pre: 85, post: 90 },
  { pre: 65, post: null },
  { pre: 100, post: 100 }
])
dekat(t.gain, 0.35, 'rata-rata gain empat siswa')
assert.equal(t.jumlahDinilai, 4, 'hanya empat siswa yang punya pre dan post sah')
assert.equal(t.jumlahDikecualikan, 2, 'tanpa post dan pre=100 dicatat terpisah')

assert.equal(gainTentor([]).gain, null, 'tanpa siswa: null, bukan 0')
assert.equal(gainTentor([{ pre: 100, post: 100 }]).gain, null, 'semua dikecualikan: null')

// --- Kelengkapan jurnal ------------------------------------------------------
dekat(kelengkapanJurnal(4, 3), 0.75, '3 dari 4 sesi')
assert.equal(kelengkapanJurnal(0, 0), null, 'tanpa sesi: null, bukan 0')

// --- Skor akhir --------------------------------------------------------------
// gain 0,35 (rata-rata keempat siswa tabel) dan jurnal 0,75, bobot default 60/40.
dekat(skorKpi(0.35, 0.75, 60, 40), 51, 'skor bobot default')

// Tentor tanpa sesi: bobot jurnal dinormalisasi ulang, bukan dianggap nol.
// Kalau dianggap nol skornya 21 — hukuman atas data yang belum ada.
dekat(skorKpi(0.35, null, 60, 40), 35, 'jurnal null: bobot dinormalisasi ulang')
dekat(skorKpi(null, 0.75, 60, 40), 75, 'gain null: bobot dinormalisasi ulang')
assert.equal(skorKpi(null, null, 60, 40), 0, 'dua-duanya null: 0, UI yang menandai belum ada data')

// Bobot lain tetap sebanding.
dekat(skorKpi(0.5, 1, 50, 50), 75, 'bobot 50/50')

console.log('OK — rumus KPI cocok dengan tabel kasus uji di fase-5-execution.md')
