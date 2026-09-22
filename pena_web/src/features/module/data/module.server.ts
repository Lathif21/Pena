import { error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import {
  BUCKET_MODUL,
  hapusBerkas,
  simpanBerkas,
  urlBertandaTangan
} from '$lib/storage/berkas.server'
import type { Module } from './module'

/**
 * Modul PDF di direktori unggahan VPS, bukan di `static/`.
 *
 * Apa pun di `static/` disajikan publik tanpa autentikasi, dan modul adalah
 * konten internal — content-hierarchy.md mensyaratkan penyimpanan privat plus
 * signed URL. Direktorinya juga di luar folder aplikasi, jadi redeploy tidak
 * pernah menghapus unggahan.
 */
const BUCKET = BUCKET_MODUL
const MAX_BYTES = 20 * 1024 * 1024

export function validateModul(file: unknown): asserts file is File {
  if (!(file instanceof File) || file.size === 0) {
    throw svelteError(400, 'File tidak ditemukan atau kosong')
  }
  if (file.type !== 'application/pdf') throw svelteError(400, 'File harus berformat PDF')
  if (file.size > MAX_BYTES) throw svelteError(400, 'Ukuran file maksimal 20MB')
}

/** Path di bucket: `{sub_materi_id}/{timestamp}.pdf`, sesuai content-hierarchy.md. */
export function modulPath(subId: string) {
  return `${subId}/${Date.now()}.pdf`
}

export async function unggahModul(path: string, file: File) {
  try {
    await simpanBerkas(BUCKET, path, file)
  } catch (e) {
    throw svelteError(500, `Gagal mengunggah modul: ${(e as Error).message}`)
  }
}

export async function hapusModul(path: string) {
  await hapusBerkas(BUCKET, path)
}

/**
 * Signed URL, diterbitkan server. Tidak ada URL publik untuk modul.
 *
 * Sepuluh menit: cukup untuk membaca satu PDF, dan tautan yang tersalin ke luar
 * ikut kedaluwarsa dengan sendirinya.
 */
export async function signedModuleUrl(path: string, detik = 600) {
  return urlBertandaTangan(BUCKET, path, detik)
}

export async function getModuleBySubMateri(subMateriId: string) {
  const { data, error } = await supabaseAdmin
    .from('module')
    .select('id, sub_materi_id, status, storage_path, published_at, created_at, deleted_at')
    .eq('sub_materi_id', subMateriId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return data as Module | null
}
