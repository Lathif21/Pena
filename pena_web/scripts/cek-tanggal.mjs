// Pemeriksaan terkecil yang gagal kalau logika tanggal relief rusak.
// Jalankan: node scripts/cek-tanggal.mjs
import assert from 'node:assert/strict'
import { hariIni } from '../src/lib/utils/tanggal.js'

// 23:30 UTC = 06:30 WIB keesokan harinya. Inilah jam yang membuat pengganti
// ditolak kalau seseorang mengganti implementasinya dengan toISOString().
const malam = new Date('2026-09-11T23:30:00Z')
assert.equal(hariIni(malam), '2026-09-12', 'tanggal harus mengikuti WIB, bukan UTC')
assert.equal(malam.toISOString().slice(0, 10), '2026-09-11', 'UTC memang beda hari di jam ini')

// Siang hari keduanya sama — pastikan tidak malah tergeser ke depan.
assert.equal(hariIni(new Date('2026-09-12T05:00:00Z')), '2026-09-12')

console.log('OK — hariIni() mengikuti Asia/Jakarta')
