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

// --- Batas periode KPI -------------------------------------------------------
const { periodeBulanan } = await import('../src/lib/utils/tanggal.js')
assert.deepEqual(periodeBulanan('2026-09-12'), { mulai: '2026-09-01', selesai: '2026-09-30' })
assert.deepEqual(periodeBulanan('2026-02-05'), { mulai: '2026-02-01', selesai: '2026-02-28' })
// 2028 kabisat — hari terakhir Februari harus 29, bukan 28
assert.deepEqual(periodeBulanan('2028-02-05'), { mulai: '2028-02-01', selesai: '2028-02-29' })
assert.deepEqual(periodeBulanan('2026-12-31'), { mulai: '2026-12-01', selesai: '2026-12-31' })
console.log('OK — periodeBulanan() benar, termasuk tahun kabisat')
