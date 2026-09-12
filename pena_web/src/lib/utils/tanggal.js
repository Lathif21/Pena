/**
 * Tanggal hari ini menurut waktu Indonesia Barat, bukan waktu server.
 *
 * Otorisasi relief bergantung pada `tanggal = hari ini`. Memakai
 * `new Date().toISOString().slice(0, 10)` akan salah: pada 06:00 WIB jam UTC
 * masih 23:00 hari sebelumnya, jadi baris relief hari itu tidak akan cocok dan
 * pengganti ditolak saat membuka sesi pagi.
 *
 * ponytail: zona dikunci ke Asia/Jakarta. Satu bimbel, satu zona waktu — kalau
 * suatu saat ada cabang WITA/WIT, ini yang pertama harus berubah.
 *
 * Sengaja .js polos, bukan .ts: scripts/cek-tanggal.mjs mengimpor fungsi yang
 * sama persis ini, jadi pemeriksaannya menguji kode sungguhan, bukan salinan.
 */
export function hariIni(saat = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(saat)
}

/**
 * Batas periode bulanan yang memuat tanggal ini.
 *
 * Dihitung dari string YYYY-MM-DD, bukan objek Date, supaya tidak ada
 * pergeseran zona waktu di tengah jalan — `hariIni()` sudah mengembalikan
 * tanggal WIB dan di sinilah ia dipakai.
 *
 * @param {string} tanggal YYYY-MM-DD
 * @returns {{mulai: string, selesai: string}}
 */
export function periodeBulanan(tanggal) {
  const [t, b] = tanggal.split('-').map(Number)
  const hariTerakhir = new Date(Date.UTC(t, b, 0)).getUTCDate()
  const bb = String(b).padStart(2, '0')
  return { mulai: `${t}-${bb}-01`, selesai: `${t}-${bb}-${hariTerakhir}` }
}
