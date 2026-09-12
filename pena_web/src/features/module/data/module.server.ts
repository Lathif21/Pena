import { error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'

/**
 * Modul PDF di Supabase Storage, bukan di `static/`.
 *
 * Apa pun di `static/` disajikan publik tanpa autentikasi, dan modul adalah
 * konten internal — content-hierarchy.md mensyaratkan bucket privat plus signed
 * URL. Menulis ke filesystem juga tidak bertahan di hosting serverless: tiap
 * invocation dapat disk baru, jadi file yang diunggah hari ini hilang besok.
 */
const BUCKET = 'modul-pdf'
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
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: 'application/pdf', upsert: false })

  if (error) throw svelteError(500, `Gagal mengunggah modul: ${error.message}`)
}

export async function hapusModul(path: string) {
  await supabaseAdmin.storage.from(BUCKET).remove([path])
}

/**
 * Signed URL, diterbitkan server. Tidak ada URL publik untuk modul.
 *
 * Sepuluh menit: cukup untuk membaca satu PDF, dan tautan yang tersalin ke luar
 * ikut kedaluwarsa dengan sendirinya.
 */
export async function signedModuleUrl(path: string, detik = 600) {
  const { data } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, detik)
  return data?.signedUrl ?? null
}
