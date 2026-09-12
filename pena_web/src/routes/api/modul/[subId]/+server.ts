import { pesanRamah } from '$lib/utils/pesan'
import { json, error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import {
  validateModul,
  modulPath,
  unggahModul,
  hapusModul,
  signedModuleUrl
} from '$features/module/data/module.server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Peran pemanggil, dipakai dua handler di bawah. */
async function pemanggil(cookies: Parameters<typeof createSupabaseServerClient>[0]) {
  const supabase = createSupabaseServerClient(cookies)
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) throw svelteError(401, 'Belum login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  return { supabase, role: profile?.role }
}

/**
 * Signed URL modul untuk satu sub materi.
 *
 * Ada karena signed URL harus diterbitkan di server: halaman kelola modul milik
 * kepala guru berjalan di browser dan tidak boleh memegang service_role key.
 */
export async function GET({ cookies, params }) {
  if (!UUID.test(params.subId)) throw svelteError(400, 'Sub materi tidak valid')

  const { supabase, role } = await pemanggil(cookies)
  if (role !== 'kepala_guru') throw svelteError(403, 'Tidak diizinkan')

  const { data: modul } = await supabase
    .from('module')
    .select('id, status, storage_path')
    .eq('sub_materi_id', params.subId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!modul) return json({ modul: null, url: null })

  return json({ modul, url: await signedModuleUrl(modul.storage_path) })
}

export async function POST({ request, cookies, params }) {
  // subId jadi bagian path di bucket, jadi wajib uuid — bukan string dari klien.
  if (!UUID.test(params.subId)) throw svelteError(400, 'Sub materi tidak valid')

  const { supabase, role } = await pemanggil(cookies)
  if (role !== 'kepala_guru') {
    throw svelteError(403, 'Hanya kepala guru yang bisa mengunggah modul')
  }

  const { data: subMateri } = await supabase
    .from('sub_materi')
    .select('id')
    .eq('id', params.subId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!subMateri) throw svelteError(404, 'Sub materi tidak ditemukan')

  const { data: existing } = await supabase
    .from('module')
    .select('id, status, storage_path')
    .eq('sub_materi_id', params.subId)
    .is('deleted_at', null)
    .maybeSingle()

  // Konten published terkunci — ditolak sebelum apa pun diunggah.
  if (existing?.status === 'published') {
    throw svelteError(409, 'Tidak bisa ganti PDF yang sudah dipublish')
  }

  const form = await request.formData()
  const file = form.get('file')
  validateModul(file)

  const path = modulPath(params.subId)
  await unggahModul(path, file)

  const { data: saved, error: dbError } = existing
    ? await supabase
        .from('module')
        .update({ storage_path: path, status: 'draft' })
        .eq('id', existing.id)
        .select()
        .single()
    : await supabase
        .from('module')
        .insert({ sub_materi_id: params.subId, storage_path: path, status: 'draft' })
        .select()
        .single()

  if (dbError) {
    // Barisnya tidak pernah jadi — buang filenya supaya tidak yatim di bucket.
    await hapusModul(path)
    throw svelteError(500, pesanRamah(dbError, 'Gagal menyimpan. Coba lagi sebentar.'))
  }

  // File lama dibuang hanya setelah barisnya menunjuk yang baru.
  if (existing?.storage_path && existing.storage_path !== path) {
    await hapusModul(existing.storage_path)
  }

  return json(saved)
}
