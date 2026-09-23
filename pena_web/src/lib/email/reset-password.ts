import { transporter, FROM } from './client'

export interface IsiKodeReset {
  kepada: string
  nama: string
  kode: string
  menitBerlaku: number
}

export async function kirimKodeReset(isi: IsiKodeReset) {
  await transporter.sendMail({
    from: FROM,
    to: isi.kepada,
    subject: `Kode ganti password Pena: ${isi.kode}`,
    text: `Halo ${isi.nama},

Seseorang meminta ganti password untuk akun Pena Anda. Masukkan kode ini di halaman Lupa Password:

    ${isi.kode}

Kode berlaku ${isi.menitBerlaku} menit dan hanya bisa dipakai sekali.

Kalau Anda tidak memintanya, abaikan email ini — password Anda tidak berubah.`
  })
}
