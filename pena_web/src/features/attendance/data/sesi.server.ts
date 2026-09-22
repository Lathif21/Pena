import { error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import {
  BUCKET_FOTO,
  hapusBerkas,
  simpanBerkas,
  urlBertandaTangan
} from '$lib/storage/berkas.server'
import type { Sesi, Pilihan } from './sesi'

export const BUCKET = BUCKET_FOTO
const MAX_BYTE = 5 * 1024 * 1024
const MIME_BOLEH = ['image/jpeg', 'image/png']

/**
 * Satu-satunya tempat tipe dan ukuran foto dibatasi. Waktu berkas masih di
 * Supabase, bucket ikut menjaganya; sekarang disknya menerima apa saja, jadi
 * pemeriksaan di sini yang menahan.
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

/** Menimpa path yang sama, jadi foto pengganti tidak menumpuk file yatim. */
export async function uploadFoto(path: string, file: File) {
  try {
    await simpanBerkas(BUCKET, path, file)
  } catch (e) {
    throw svelteError(400, `Gagal mengunggah foto: ${(e as Error).message}`)
  }
}

export async function hapusFoto(path: string) {
  await hapusBerkas(BUCKET, path)
}

/**
 * URL bertanda tangan, berlaku singkat. Direktorinya di luar `static/`, jadi
 * inilah satu-satunya cara foto bisa dilihat.
 */
export async function signedUrl(path: string, detik = 300) {
  return urlBertandaTangan(BUCKET, path, detik)
}

/** Kelas yang benar-benar diajar tentor ini — bukan seluruh kelas di bimbel. */
export async function listKelasByTentor(tentorId: string): Promise<Pilihan[]> {
  const { data, error } = await supabaseAdmin
    .from('tentor_kelas_mapel')
    .select('kelas:kelas_id(id, nama, deleted_at)')
    .eq('tentor_id', tentorId)
    .is('deleted_at', null)

  if (error) throw error

  const unik = new Map<string, Pilihan>()
  for (const row of (data ?? []) as any[]) {
    const k = row.kelas
    if (k && !k.deleted_at) unik.set(k.id, { id: k.id, nama: k.nama })
  }

  return [...unik.values()].sort((a, b) => a.nama.localeCompare(b.nama))
}

/**
 * Irisan dua relasi: mapel yang dipakai kelas itu (`mapel_kelas`) DAN yang
 * diajar tentor ini di kelas itu (`tentor_kelas_mapel`). Memakai salah satunya
 * saja akan menawarkan mapel yang tidak berhak dia isi presensinya.
 */
export async function listMapelByKelas(kelasId: string, tentorId: string): Promise<Pilihan[]> {
  const [{ data: diajar, error: eDiajar }, { data: dipakai, error: eDipakai }] = await Promise.all([
    supabaseAdmin
      .from('tentor_kelas_mapel')
      .select('mapel_id')
      .eq('tentor_id', tentorId)
      .eq('kelas_id', kelasId)
      .is('deleted_at', null),
    supabaseAdmin.from('mapel_kelas').select('mapel_id').eq('kelas_id', kelasId)
  ])

  if (eDiajar) throw eDiajar
  if (eDipakai) throw eDipakai

  const dipakaiSet = new Set((dipakai ?? []).map((m: any) => m.mapel_id))
  const ids = [...new Set((diajar ?? []).map((m: any) => m.mapel_id))].filter((id) =>
    dipakaiSet.has(id)
  )
  if (ids.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('mapel')
    .select('id, nama')
    .in('id', ids)
    .is('deleted_at', null)
    .order('nama')

  if (error) throw error
  return data ?? []
}

/** Sesi yang masih berjalan milik tentor ini. Paling banyak satu pada satu waktu. */
export async function getSesiAktif(tentorId: string): Promise<Sesi | null> {
  const { data, error } = await supabaseAdmin
    .from('sesi_mengajar')
    .select('*')
    .eq('tentor_id', tentorId)
    .eq('status', 'open')
    .is('deleted_at', null)
    .order('started_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return (data ?? [])[0] ?? null
}
