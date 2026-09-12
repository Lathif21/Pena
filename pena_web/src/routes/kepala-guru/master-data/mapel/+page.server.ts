import { pesanRamah } from '$lib/utils/pesan'
import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data, error } = await supabase
    .from('mapel')
    .select('id, nama, created_at, deleted_at, mapel_kelas(kelas_id, kelas:kelas_id(nama))')
    .is('deleted_at', null)
    .order('nama')

  if (error) throw svelteError(500, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  const mapel = (data ?? []).map((m: any) => ({
    id: m.id,
    nama: m.nama,
    created_at: m.created_at,
    deleted_at: m.deleted_at,
    kelas_ids: (m.mapel_kelas ?? []).map((mk: any) => mk.kelas_id),
    kelas_nama: (m.mapel_kelas ?? []).map((mk: any) => mk.kelas?.nama).filter(Boolean)
  }))

  return { ...parentData, mapel }
}
