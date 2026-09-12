import { transporter, FROM } from './client'

/**
 * Notifikasi relief — satu-satunya email yang dikirim Pena.
 *
 * Modul ini tidak tahu apa-apa soal skema: pemanggil yang menyiapkan nama,
 * alamat, dan tautan. Isinya murni perakitan dan pengiriman, supaya perubahan
 * kolom di tabel relief tidak pernah menyeret file ini.
 */
export interface IsiRelief {
  tentorAsliNama: string
  penggantiNama: string
  kelasNama: string
  mapelNama: string
  tanggal: string
  task: string
  /** Alamat penerima: pengganti dan kepala guru. */
  kepada: string[]
  /** Asal aplikasi, untuk menyusun tautan absolut ke dashboard. */
  origin: string
}

const tanggalPanjang = (iso: string) =>
  new Date(`${iso}T00:00:00+07:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

function rincian(isi: IsiRelief) {
  return [
    `Tentor asli : ${isi.tentorAsliNama}`,
    `Pengganti   : ${isi.penggantiNama}`,
    `Kelas       : ${isi.kelasNama}`,
    `Mata pelajaran: ${isi.mapelNama}`,
    `Tanggal     : ${tanggalPanjang(isi.tanggal)}`
  ].join('\n')
}

export async function kirimReliefBaru(isi: IsiRelief) {
  if (isi.kepada.length === 0) return

  await transporter.sendMail({
    from: FROM,
    to: isi.kepada,
    subject: `Relief: ${isi.kelasNama} · ${isi.mapelNama} — ${tanggalPanjang(isi.tanggal)}`,
    text: `${isi.penggantiNama} diminta menggantikan ${isi.tentorAsliNama} mengajar.

${rincian(isi)}

Task delegasi dari ${isi.tentorAsliNama}:
${isi.task}

Buka dashboard: ${isi.origin}/tentor/dashboard

Presensi diri dibuka seperti biasa — kelas ini akan muncul di dropdown pada tanggal tersebut.`
  })
}

export async function kirimReliefDibatalkan(isi: IsiRelief) {
  if (isi.kepada.length === 0) return

  await transporter.sendMail({
    from: FROM,
    to: isi.kepada,
    subject: `Relief DIBATALKAN: ${isi.kelasNama} · ${isi.mapelNama} — ${tanggalPanjang(isi.tanggal)}`,
    text: `Permintaan relief berikut dibatalkan oleh ${isi.tentorAsliNama}.

${rincian(isi)}

${isi.penggantiNama} tidak perlu menggantikan sesi ini. Kewenangan membuka sesi untuk kelas tersebut sudah dicabut.

Buka dashboard: ${isi.origin}/tentor/dashboard`
  })
}
