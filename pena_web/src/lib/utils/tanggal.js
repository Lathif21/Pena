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
