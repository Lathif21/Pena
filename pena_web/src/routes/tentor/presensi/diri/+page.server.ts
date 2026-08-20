import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { signedUrl } from '$features/attendance/data/sesi.server'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const tentorId = parentData.user.id

  const { data: assignments, error: aError } = await supabase
    .from('tentor_kelas_mapel')
    .select('kelas:kelas_id(id, nama, deleted_at)')
    .eq('tentor_id', tentorId)
    .is('deleted_at', null)

  if (aError) throw svelteError(500, aError.message)

  // Kelas yang diajar tentor ini saja — dropdown tidak pernah memuat seluruh kelas.
  const unik = new Map<string, { id: string; nama: string }>()
  for (const row of (assignments ?? []) as any[]) {
    const k = row.kelas
    if (k && !k.deleted_at) unik.set(k.id, { id: k.id, nama: k.nama })
  }
  const kelas = [...unik.values()].sort((a, b) => a.nama.localeCompare(b.nama))

  const { data: sesi } = await supabase
    .from('sesi_mengajar')
    .select('id, kelas_id, mapel_id, foto_path, uploaded_at, started_at, status, kelas:kelas_id(nama), mapel:mapel_id(nama)')
    .eq('tentor_id', tentorId)
    .eq('status', 'open')
    .is('deleted_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Bucket privat: foto hanya bisa dilihat lewat signed URL yang diterbitkan server.
  const fotoUrl = sesi?.foto_path ? await signedUrl(sesi.foto_path) : null

  return {
    ...parentData,
    kelas,
    sesiAktif: sesi
      ? {
          id: sesi.id,
          kelasNama: (sesi as any).kelas?.nama ?? '',
          mapelNama: (sesi as any).mapel?.nama ?? '',
          uploadedAt: sesi.uploaded_at,
          startedAt: sesi.started_at,
          fotoUrl
        }
      : null
  }
}
