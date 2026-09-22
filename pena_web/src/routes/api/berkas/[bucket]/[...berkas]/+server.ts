import { error } from '@sveltejs/kit'
import {
  BUCKET_FOTO,
  BUCKET_MODUL,
  bacaBerkas,
  tandaTanganSah
} from '$lib/storage/berkas.server'

const BUCKET_DIKENAL = new Set([BUCKET_FOTO, BUCKET_MODUL])

const TIPE: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png'
}

/**
 * Menyajikan berkas unggahan hanya kalau tanda tangannya sah dan belum lewat
 * waktu. Sengaja tidak memeriksa sesi: tanda tangan itu sendiri yang jadi
 * otorisasinya, persis seperti signed URL Supabase dulu — dan itu yang membuat
 * tautan bisa dipakai <img> dan <iframe> tanpa ikut mengirim cookie.
 */
export async function GET({ params, url, setHeaders }) {
  const { bucket, berkas } = params
  if (!bucket || !berkas || !BUCKET_DIKENAL.has(bucket)) throw error(404, 'Tidak ditemukan')

  if (!tandaTanganSah(bucket, berkas, url.searchParams.get('exp'), url.searchParams.get('sig'))) {
    throw error(403, 'Tautan tidak sah atau sudah kedaluwarsa')
  }

  let isi: Buffer
  try {
    ({ isi } = await bacaBerkas(bucket, berkas))
  } catch {
    throw error(404, 'Berkas tidak ditemukan')
  }

  const ext = berkas.slice(berkas.lastIndexOf('.')).toLowerCase()

  setHeaders({
    'content-type': TIPE[ext] ?? 'application/octet-stream',
    'content-length': String(isi.byteLength),
    // private: tautan ini bertanda tangan per pengguna, jangan disimpan proxy.
    'cache-control': 'private, max-age=60'
  })

  return new Response(new Uint8Array(isi))
}
