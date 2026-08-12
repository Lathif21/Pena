import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, params, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: mapel } = await supabase
    .from('mapel')
    .select('id, nama')
    .eq('id', params.mapelId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!mapel) throw svelteError(404, 'Mapel tidak ditemukan')

  const { data: siswaDetail } = await supabase
    .from('siswa_detail')
    .select('id')
    .eq('profile_id', parentData.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!siswaDetail) throw svelteError(403, 'Data siswa tidak ditemukan')

  // Scoping is not just a filter on the list page — without this check any student
  // could read another kelas's content by typing the mapel id into the URL.
  const { data: kelasSiswa } = await supabase
    .from('siswa_kelas')
    .select('kelas_id')
    .eq('siswa_detail_id', siswaDetail.id)
    .is('deleted_at', null)

  const kelasIds = (kelasSiswa ?? []).map((k) => k.kelas_id)

  const { data: linked } = kelasIds.length
    ? await supabase
        .from('mapel_kelas')
        .select('kelas_id')
        .eq('mapel_id', params.mapelId)
        .in('kelas_id', kelasIds)
        .limit(1)
    : { data: [] }

  if ((linked ?? []).length === 0) {
    throw svelteError(403, 'Mata pelajaran ini bukan untuk kelas Anda')
  }

  const { data: materiData } = await supabase
    .from('materi')
    .select('id, nama, nomor_urut')
    .eq('mapel_id', params.mapelId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (!materiData || materiData.length === 0) {
    return { ...parentData, mapel, materi: [] }
  }

  const materiIds = materiData.map((m) => m.id)

  const { data: subMateriData } = await supabase
    .from('sub_materi')
    .select('id, nama, nomor_urut, materi_id')
    .in('materi_id', materiIds)
    .is('deleted_at', null)
    .order('nomor_urut')

  const subMateri = subMateriData ?? []

  // Hanya modul yang sudah published yang terlihat oleh siswa
  const { data: publishedModules } = subMateri.length
    ? await supabase
        .from('module')
        .select('sub_materi_id')
        .in('sub_materi_id', subMateri.map((s) => s.id))
        .eq('status', 'published')
        .is('deleted_at', null)
    : { data: [] }

  const publishedSubIds = new Set((publishedModules ?? []).map((m) => m.sub_materi_id))

  const subByMateri = new Map<string, any[]>()
  for (const sub of subMateri) {
    if (!publishedSubIds.has(sub.id)) continue
    if (!subByMateri.has(sub.materi_id)) subByMateri.set(sub.materi_id, [])
    subByMateri.get(sub.materi_id)!.push({ id: sub.id, nama: sub.nama, nomor_urut: sub.nomor_urut })
  }

  // Try out published yang menargetkan kelas siswa ini.
  const { data: tryOutData } = await supabase
    .from('try_out')
    .select('id, judul, materi_id, tipe_test, waktu_buka, durasi_menit, try_out_kelas(kelas_id)')
    .in('materi_id', materiIds)
    .eq('status', 'published')
    .is('deleted_at', null)

  const { data: attempts } = await supabase
    .from('attempt')
    .select('try_out_id, submitted_at, nilai')
    .eq('siswa_detail_id', siswaDetail.id)
    .eq('is_active', true)
    .is('deleted_at', null)

  const attemptByTryOut = new Map(
    (attempts ?? []).filter((a) => a.try_out_id).map((a) => [a.try_out_id as string, a])
  )

  const now = Date.now()
  const tryOutByMateri = new Map<string, any[]>()

  for (const t of tryOutData ?? []) {
    const targets = (t.try_out_kelas ?? []).map((k: any) => k.kelas_id)
    if (targets.length > 0 && !targets.some((id: string) => kelasIds.includes(id))) continue

    const buka = new Date(t.waktu_buka).getTime()
    const tutup = buka + t.durasi_menit * 60000
    const attempt = attemptByTryOut.get(t.id)

    // The try out is listed whatever its state — a student should know one is coming.
    // Only the soal stay hidden until the window opens, and that is enforced in the
    // try out loader, which never queries them early.
    const status = attempt?.submitted_at
      ? 'selesai'
      : now < buka
        ? 'belum_buka'
        : now <= tutup
          ? 'terbuka'
          : 'terlewat'

    if (!tryOutByMateri.has(t.materi_id)) tryOutByMateri.set(t.materi_id, [])
    tryOutByMateri.get(t.materi_id)!.push({
      id: t.id,
      judul: t.judul,
      tipe_test: t.tipe_test,
      durasi_menit: t.durasi_menit,
      waktu_buka: t.waktu_buka,
      waktu_tutup: new Date(tutup).toISOString(),
      status,
      // Only an open try out or a finished one (for review) can be opened.
      dapatDibuka: status === 'terbuka' || status === 'selesai',
      nilai: attempt?.submitted_at ? attempt.nilai : null
    })
  }

  // Materi muncul kalau punya modul published ATAU try out yang bisa diakses.
  const materi = materiData
    .map((m) => ({
      ...m,
      sub_materi: subByMateri.get(m.id) ?? [],
      try_out: tryOutByMateri.get(m.id) ?? []
    }))
    .filter((m) => m.sub_materi.length > 0 || m.try_out.length > 0)

  return { ...parentData, mapel, materi }
}
