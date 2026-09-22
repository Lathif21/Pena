import { createHmac, timingSafeEqual } from 'node:crypto'
import { mkdir, writeFile, unlink, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { env } from '$env/dynamic/private'

/**
 * Berkas unggahan di disk VPS, menggantikan Supabase Storage.
 *
 * Dua sifat bucket privat yang lama tetap dipertahankan, karena keduanya yang
 * membuat modul dan foto presensi tidak bocor:
 *
 *  1. Direktorinya di luar `static/` dan di luar folder aplikasi, jadi tidak
 *     pernah disajikan langsung oleh Caddy maupun SvelteKit.
 *  2. Satu-satunya cara membacanya lewat URL bertanda tangan yang kedaluwarsa.
 *
 * Catatan lama soal "hosting serverless kehilangan file" tidak lagi berlaku:
 * ini satu VPS dengan disk tetap. Direktorinya sengaja di luar /srv/pena/app
 * supaya redeploy (git pull + build) tidak pernah menyentuh unggahan.
 */

export const BUCKET_FOTO = 'presensi-foto'
export const BUCKET_MODUL = 'modul-pdf'

/**
 * Menolak path yang keluar dari bucket-nya. Tanpa ini `../../etc/passwd`
 * sebagai storage_path akan terbaca — dan storage_path ikut dari input.
 */
function lokasiAman(bucket: string, berkas: string) {
  const akar = path.resolve(env.STORAGE_DIR ?? '/srv/pena/data', bucket)
  const penuh = path.resolve(akar, berkas)
  if (penuh !== akar && !penuh.startsWith(akar + path.sep)) {
    throw new Error('Path berkas tidak sah')
  }
  return penuh
}

export async function simpanBerkas(bucket: string, berkas: string, file: File) {
  const tujuan = lokasiAman(bucket, berkas)
  await mkdir(path.dirname(tujuan), { recursive: true })
  await writeFile(tujuan, Buffer.from(await file.arrayBuffer()))
}

export async function hapusBerkas(bucket: string, berkas: string) {
  try {
    await unlink(lokasiAman(bucket, berkas))
  } catch {
    // Berkas yang sudah tidak ada bukan kegagalan — hasil akhirnya sama.
  }
}

export async function bacaBerkas(bucket: string, berkas: string) {
  const lokasi = lokasiAman(bucket, berkas)
  const info = await stat(lokasi)
  return { isi: await readFile(lokasi), ukuran: info.size }
}

/**
 * Tanpa rahasia, tanda tangan bisa dipalsukan siapa saja dan seluruh berkas
 * jadi terbuka — jadi lebih baik berhenti saat start daripada diam-diam
 * menandatangani dengan string kosong.
 */
function rahasia() {
  const nilai = env.STORAGE_SIGNING_SECRET
  if (!nilai) throw new Error('STORAGE_SIGNING_SECRET belum diset')
  return nilai
}

function tandaTangan(bucket: string, berkas: string, exp: number) {
  return createHmac('sha256', rahasia())
    .update(`${bucket}/${berkas}|${exp}`)
    .digest('hex')
}

/** URL bertanda tangan yang berlaku `detik` ke depan. */
export function urlBertandaTangan(bucket: string, berkas: string, detik: number) {
  const exp = Math.floor(Date.now() / 1000) + detik
  const sig = tandaTangan(bucket, berkas, exp)
  return `/api/berkas/${bucket}/${berkas}?exp=${exp}&sig=${sig}`
}

export function tandaTanganSah(bucket: string, berkas: string, exp: string | null, sig: string | null) {
  if (!exp || !sig) return false
  const batas = Number(exp)
  if (!Number.isFinite(batas) || batas < Math.floor(Date.now() / 1000)) return false

  const diharapkan = Buffer.from(tandaTangan(bucket, berkas, batas), 'utf8')
  const diberikan = Buffer.from(sig, 'utf8')
  if (diharapkan.length !== diberikan.length) return false
  return timingSafeEqual(diharapkan, diberikan)
}
