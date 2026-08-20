import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const tentorId = parentData.user.id

  const { data: sesi } = await supabase
    .from('sesi_mengajar')
    .select('id, mapel_id, status, kelas:kelas_id(nama), mapel:mapel_id(nama)')
    .eq('tentor_id', tentorId)
    .eq('status', 'open')
    .is('deleted_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sesi) return { ...parentData, sesiAktif: null, materi: [], jurnal: null }

  // Dropdown dibatasi materi milik mapel sesi ini saja.
  const { data: materi } = await supabase
    .from('materi')
    .select('id, nama, nomor_urut')
    .eq('mapel_id', sesi.mapel_id)
    .is('deleted_at', null)
    .order('nomor_urut')

  const { data: jurnal } = await supabase
    .from('jurnal_mengajar')
    .select('id, materi_id, deskripsi, status, submitted_at')
    .eq('sesi_id', sesi.id)
    .is('deleted_at', null)
    .maybeSingle()

  return {
    ...parentData,
    sesiAktif: {
      id: sesi.id,
      kelasNama: (sesi as any).kelas?.nama ?? '',
      mapelNama: (sesi as any).mapel?.nama ?? ''
    },
    materi: materi ?? [],
    jurnal
  }
}
