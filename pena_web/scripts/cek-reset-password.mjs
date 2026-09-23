// Pemeriksaan aturan kode lupa password: kedaluwarsa, batas tebakan, jeda, dan
// batas harian. Kalau salah satunya rusak, kode 6 angka bisa ditebak.
//
// Jalankan: node scripts/cek-reset-password.mjs
import assert from 'node:assert/strict'
import { tolakPermintaan, tolakKode } from '../src/features/auth/data/aturan-reset.js'

const T = Date.parse('2026-09-23T10:00:00Z')
const lalu = (menit) => new Date(T - menit * 60_000).toISOString()
const nanti = (menit) => new Date(T + menit * 60_000).toISOString()

// --- Permintaan kode baru ---------------------------------------------------
assert.equal(tolakPermintaan([], T), null, 'belum pernah minta: boleh')
assert.match(tolakPermintaan([lalu(0.5)], T), /Tunggu 1 menit/, 'jeda 1 menit')
assert.equal(tolakPermintaan([lalu(2)], T), null, 'lewat 1 menit: boleh')
assert.match(tolakPermintaan([lalu(10), lalu(20), lalu(30), lalu(40), lalu(50)], T), /5 kali/,
  'kode ke-6 dalam 24 jam ditolak')
assert.equal(tolakPermintaan([lalu(10), lalu(20), lalu(30), lalu(40), lalu(25 * 60)], T), null,
  'yang lebih dari 24 jam tidak dihitung')

// --- Memakai kode -----------------------------------------------------------
const kode = (x) => ({ percobaan: 0, expires_at: nanti(30), used_at: null, ...x })
assert.equal(tolakKode(kode(), T), null, 'kode segar: boleh dicoba')
assert.match(tolakKode(null, T), /kedaluwarsa/, 'belum pernah minta kode')
assert.match(tolakKode(kode({ expires_at: lalu(1) }), T), /kedaluwarsa/, 'lewat 1 jam')
assert.match(tolakKode(kode({ expires_at: new Date(T).toISOString() }), T), /kedaluwarsa/,
  'tepat di batas waktu sudah tidak berlaku')
assert.match(tolakKode(kode({ used_at: lalu(1) }), T), /kedaluwarsa/, 'sudah dipakai atau dibatalkan')
assert.equal(tolakKode(kode({ percobaan: 4 }), T), null, 'tebakan ke-5 masih boleh')
assert.match(tolakKode(kode({ percobaan: 5 }), T), /Terlalu banyak/, 'tebakan ke-6 ditolak')

console.log('OK — aturan kode lupa password')
