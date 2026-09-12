import nodemailer from 'nodemailer'
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from '$env/static/private'

/**
 * Satu transporter untuk seluruh aplikasi.
 *
 * Nodemailer menyimpan pool koneksi di dalam transporter; membuat yang baru tiap
 * kirim berarti handshake SMTP berulang dan, pada penyedia dengan batas koneksi,
 * penolakan saat beberapa email terkirim berdekatan.
 *
 * Kredensial server-only — tanpa prefix PUBLIC_, jadi SvelteKit menolak modul ini
 * kalau sampai terimpor dari kode klien.
 */
export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  // 465 itu SMTPS (TLS sejak awal). 587 memakai STARTTLS, yang dinegosiasi
  // setelah koneksi terbuka — jadi secure harus false di sana.
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
})

export const FROM = SMTP_FROM

/** Memastikan kredensial dan koneksi benar tanpa mengirim apa pun. */
export async function verifikasiSmtp() {
  return transporter.verify()
}
