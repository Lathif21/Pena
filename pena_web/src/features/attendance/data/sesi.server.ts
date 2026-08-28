import { error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'

export const BUCKET = 'presensi-foto'
const MAX_BYTE = 5 * 1024 * 1024
const MIME_BOLEH = ['image/jpeg', 'image/png']

/**
 * Bucket sudah membatasi tipe dan ukuran, tapi ditolak di sini juga supaya
 * tentor dapat pesan yang bisa dibaca, bukan error mentah dari storage.
 */
export function validateFoto(file: unknown): asserts file is File {
  if (!(file instanceof File) || file.size === 0) {
    throw svelteError(400, 'Foto presensi wajib diunggah')
  }
  if (!MIME_BOLEH.includes(file.type)) {
    throw svelteError(400, 'Foto harus JPG atau PNG')
  }
  if (file.size > MAX_BYTE) {
    throw svelteError(400, 'Ukuran foto maksimal 5MB')
  }
}

export function fotoPath(tahunAjaranId: string, sesiId: string, file: File) {
  return `${tahunAjaranId}/${sesiId}.${file.type === 'image/png' ? 'png' : 'jpg'}`
}

/** upsert: mengganti foto memakai path yang sama, jadi tidak menumpuk file yatim. */
export async function uploadFoto(path: string, file: File) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true })

  if (error) throw svelteError(400, `Gagal mengunggah foto: ${error.message}`)
}

export async function hapusFoto(path: string) {
  await supabaseAdmin.storage.from(BUCKET).remove([path]).catch(() => {})
}

/**
 * URL bertanda tangan, berlaku singkat. Bucket-nya privat, jadi inilah satu-satunya
 * cara foto bisa dilihat — URL publik bucket akan menolak.
 */
export async function signedUrl(path: string, detik = 300) {
  const { data } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, detik)
  return data?.signedUrl ?? null
}
