/**
 * Perakit CSV. Tanpa pustaka — yang dibutuhkan hanya escaping yang benar.
 *
 * Sengaja .js polos supaya scripts/cek-csv.mjs mengimpor fungsi yang sama.
 */

/**
 * Pemisah titik koma, bukan koma.
 *
 * Excel memakai daftar pemisah sesuai locale Windows, dan pada Windows
 * Indonesia itu titik koma. Dengan koma, seluruh baris mendarat di satu kolom
 * dan kepala guru melihat file yang tampak rusak.
 */
const PEMISAH = ';'

/** Karakter pembuka formula di Excel. Nama siswa yang diawali ini akan dieksekusi. */
const AWALAN_FORMULA = ['=', '+', '-', '@', '\t', '\r']

/**
 * @param {unknown} nilai
 * @returns {string}
 */
export function selSatu(nilai) {
  if (nilai === null || nilai === undefined) return ''

  // Angka tidak pernah diberi pengaman formula: tanda minus di depan bilangan
  // negatif itu sah, dan mengawalinya dengan kutip merusak selnya jadi teks.
  if (typeof nilai === 'number') return String(nilai)

  let teks = String(nilai)

  // Injeksi formula: sel yang diawali '=' dijalankan Excel saat file dibuka.
  // Kutip tunggal di depan membuat Excel memperlakukannya sebagai teks, dan
  // kutipnya sendiri tidak ikut terlihat di sel.
  if (AWALAN_FORMULA.includes(teks[0])) teks = "'" + teks

  // Bungkus hanya kalau perlu, supaya file tetap enak dibaca mata.
  if (teks.includes(PEMISAH) || teks.includes('"') || /[\n\r]/.test(teks)) {
    return '"' + teks.replaceAll('"', '""') + '"'
  }
  return teks
}

/**
 * @param {Array<Record<string, unknown>>} baris
 * @param {Array<{kunci: string, judul: string}>} kolom
 * @returns {string} isi CSV lengkap dengan BOM
 */
export function keCsv(baris, kolom) {
  const judul = kolom.map((k) => selSatu(k.judul)).join(PEMISAH)
  const isi = baris.map((b) => kolom.map((k) => selSatu(b[k.kunci])).join(PEMISAH))

  // BOM UTF-8 supaya Excel membaca huruf beraksen dan karakter non-ASCII dengan
  // benar. Tanpa ini nama seperti "Fitriaÿ" muncil rusak di Windows.
  // CRLF: baris yang dipisah LF saja bikin sebagian versi Excel menyambung baris.
  return '﻿' + [judul, ...isi].join('\r\n') + '\r\n'
}

/**
 * Nama file yang membawa konteks filternya, supaya file yang sudah diunduh
 * tetap bisa dijelaskan tanpa membuka isinya.
 *
 * @param {string} dasar
 * @param {Array<string|null|undefined>} bagian
 * @param {string} tanggal YYYY-MM-DD
 */
export function namaBerkas(dasar, bagian, tanggal) {
  const bersih = bagian
    .filter(Boolean)
    .map((b) => String(b).trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
  return [dasar, ...bersih, tanggal].join('_') + '.csv'
}
