/**
 * Aritmetika KPI. Tanpa akses database sama sekali.
 *
 * Sengaja .js polos dan bebas impor, seperti lib/utils/tanggal.js:
 * scripts/cek-kpi.mjs mengimpor fungsi-fungsi ini apa adanya, jadi
 * pemeriksaannya menguji kode yang benar-benar dipakai — bukan salinannya.
 * Pengambilan data tinggal di snapshot.ts.
 */

/**
 * Normalized Gain satu siswa: berapa bagian dari ruang perbaikan yang tersisa
 * berhasil ditutup.
 *
 * Kenaikan mentah tidak dipakai karena tidak adil — menaikkan siswa dari 85 ke
 * 92 jauh lebih sulit daripada 40 ke 60, tapi selisih mentahnya membuat yang
 * kedua terlihat tiga kali lebih baik.
 *
 * @param {number|null} pre
 * @param {number|null} post
 * @returns {number|null} null kalau siswa ini tidak bisa dihitung
 */
export function normalizedGain(pre, post) {
  if (pre === null || post === null) return null
  // pre = 100 membuat penyebut nol. Dikecualikan, bukan dihitung nol: siswa
  // yang sudah sempurna tidak bisa naik, dan menghitungnya nol menghukum
  // tentor atas hasil terbaiknya.
  if (pre >= 100) return null
  // Negatif dibiarkan negatif. Penurunan nilai adalah informasi nyata.
  return (post - pre) / (100 - pre)
}

/**
 * Gain tentor: rata-rata gain seluruh siswa yang bisa dihitung.
 *
 * @param {Array<{pre: number|null, post: number|null}>} siswa
 * @returns {{gain: number|null, jumlahDinilai: number, jumlahDikecualikan: number}}
 */
export function gainTentor(siswa) {
  const terhitung = []
  let dikecualikan = 0

  for (const s of siswa) {
    const g = normalizedGain(s.pre, s.post)
    if (g === null) dikecualikan++
    else terhitung.push(g)
  }

  return {
    gain: terhitung.length === 0 ? null : terhitung.reduce((a, b) => a + b, 0) / terhitung.length,
    jumlahDinilai: terhitung.length,
    jumlahDikecualikan: dikecualikan
  }
}

/**
 * Kelengkapan jurnal: sesi yang jurnalnya submitted dibagi seluruh sesi.
 *
 * @param {number} totalSesi
 * @param {number} sesiBerjurnal
 * @returns {number|null} null kalau tentor belum punya sesi sama sekali
 */
export function kelengkapanJurnal(totalSesi, sesiBerjurnal) {
  // null, bukan 0 — "belum ada data" berbeda dari "gagal".
  if (totalSesi === 0) return null
  return sesiBerjurnal / totalSesi
}

/**
 * Skor akhir 0–100.
 *
 * Komponen yang null dikeluarkan dan bobotnya dinormalisasi ulang ke komponen
 * yang tersisa. Kalau tidak, tentor yang belum punya sesi kehilangan 40 poin
 * atas data yang belum ada — persis hukuman yang dilarang kpi.md. Dua-duanya
 * null menghasilkan 0, dan pemanggil menampilkan "belum ada data" berdasarkan
 * null komponennya, bukan berdasarkan skor ini.
 *
 * @param {number|null} gain 0–1
 * @param {number|null} jurnal 0–1
 * @param {number} bobotGain
 * @param {number} bobotJurnal
 * @returns {number} dibulatkan ke dua desimal
 */
export function skorKpi(gain, jurnal, bobotGain, bobotJurnal) {
  const bagian = []
  if (gain !== null) bagian.push([gain, bobotGain])
  if (jurnal !== null) bagian.push([jurnal, bobotJurnal])

  const totalBobot = bagian.reduce((t, [, b]) => t + b, 0)
  if (totalBobot === 0) return 0

  const tertimbang = bagian.reduce((t, [n, b]) => t + n * b, 0)
  return Math.round((tertimbang / totalBobot) * 100 * 100) / 100
}

/**
 * Ambang minimum sebelum skor layak ditampilkan sebagai angka.
 *
 * Tanpa ini, tentor dengan satu sesi berjurnal dan nol nilai mendapat skor 100
 * — tertinggi di daftar — karena bobot komponen yang kosong dinormalisasi
 * ulang. Normalisasi itu benar (jangan menghukum data yang belum ada), tapi
 * efek sampingnya memberi imbalan pada data yang sedikit.
 *
 * Tiga dan tiga: di bawah itu rata-rata Normalized Gain tidak bermakna, dan
 * persentase jurnal dari satu sesi hanya bisa 0% atau 100%.
 */
export const MIN_SISWA = 3
export const MIN_SESI = 3

/**
 * @param {number} jumlahSiswaDinilai
 * @param {number} jumlahSesi
 * @returns {boolean}
 */
export function cukupData(jumlahSiswaDinilai, jumlahSesi) {
  return jumlahSiswaDinilai >= MIN_SISWA && jumlahSesi >= MIN_SESI
}
