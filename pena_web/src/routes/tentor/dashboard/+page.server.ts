import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { reliefHariIniLengkap } from '$features/relief/data/relief.server'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const tentorId = parentData.user.id

  const { data: sesi } = await supabase
    .from('sesi_mengajar')
    .select('id, mapel_id, started_at, status, kelas:kelas_id(nama), mapel:mapel_id(nama)')
    .eq('tentor_id', tentorId)
    .eq('status', 'open')
    .is('deleted_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Tombol Selesai Mengajar mati sampai jurnal ada. Prasyaratnya tetap ditegakkan
  // di RPC — ini hanya supaya tentor tidak menekan tombol yang pasti ditolak.
  const { data: jurnal } = sesi
    ? await supabase
        .from('jurnal_mengajar')
        .select('id, status')
        .eq('sesi_id', sesi.id)
        .is('deleted_at', null)
        .maybeSingle()
    : { data: null }

  // Sesi yang sudah ditutup hari ini, untuk status "selesai" di dashboard.
  const awalHari = new Date()
  awalHari.setHours(0, 0, 0, 0)

  const { data: selesaiHariIni } = await supabase
    .from('sesi_mengajar')
    .select('id, ended_at, kelas:kelas_id(nama), mapel:mapel_id(nama)')
    .eq('tentor_id', tentorId)
    .eq('status', 'closed')
    .gte('started_at', awalHari.toISOString())
    .is('deleted_at', null)
    .order('ended_at', { ascending: false })

  // Relief yang ditugaskan ke tentor ini hari ini — izinnya habis lewat tengah malam.
  const reliefUntukSaya = await reliefHariIniLengkap(supabase, tentorId)

  return {
    ...parentData,
    reliefUntukSaya,
    sesiAktif: sesi
      ? {
          id: sesi.id,
          kelasNama: (sesi as any).kelas?.nama ?? '',
          mapelNama: (sesi as any).mapel?.nama ?? '',
          startedAt: sesi.started_at,
          adaJurnal: !!jurnal
        }
      : null,
    selesaiHariIni: (selesaiHariIni ?? []).map((s: any) => ({
      id: s.id,
      kelasNama: s.kelas?.nama ?? '',
      mapelNama: s.mapel?.nama ?? '',
      endedAt: s.ended_at
    }))
  }
}

export const actions = {
  logout: async ({ cookies }) => {
    const supabase = createSupabaseServerClient(cookies)
    await supabase.auth.signOut()
    redirect(303, '/auth/login')
  }
}
