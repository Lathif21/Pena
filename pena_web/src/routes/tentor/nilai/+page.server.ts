import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

/**
 * Nilai per siswa for one mapel: try out results from e-learning alongside the
 * tentor's manually entered grades.
 *
 * Runs server-side and derives the student list from the tentor's own assignments —
 * the previous client-side version queried siswa_detail.nama_lengkap (a column that
 * lives on profiles), so it errored before rendering anything, and it pulled attempts
 * for every mapel rather than the selected one.
 */
export async function load({ cookies, parent, url }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const tentorId = parentData.user.id

  const mapelId = url.searchParams.get('mapel') ?? ''
  const kelasId = url.searchParams.get('kelas') ?? ''

  const [{ data: kelasMapel, error: kmError }, { data: privat }] = await Promise.all([
    supabase
      .from('tentor_kelas_mapel')
      .select('mapel_id, kelas_id')
      .eq('tentor_id', tentorId)
      .is('deleted_at', null),
    supabase
      .from('tentor_siswa_privat')
      .select('mapel_id, siswa_detail_id')
      .eq('tentor_id', tentorId)
      .is('deleted_at', null)
  ])

  if (kmError) throw svelteError(500, kmError.message)

  const assignments = kelasMapel ?? []
  const privatAssignments = privat ?? []

  // A tentor may teach a mapel only privately, so both sources feed the dropdown.
  const mapelIds = [...new Set([...assignments, ...privatAssignments].map((a) => a.mapel_id))]
  const kelasIds = [...new Set(assignments.map((a) => a.kelas_id))]

  const [{ data: mapelRows }, { data: kelasRows }] = await Promise.all([
    mapelIds.length
      ? supabase.from('mapel').select('id, nama').in('id', mapelIds).is('deleted_at', null).order('nama')
      : Promise.resolve({ data: [] as any[] }),
    kelasIds.length
      ? supabase.from('kelas').select('id, nama').in('id', kelasIds).is('deleted_at', null).order('nama')
      : Promise.resolve({ data: [] as any[] })
  ])

  const mapel = mapelRows ?? []
  const kelas = kelasRows ?? []

  if (!mapelId) {
    return { ...parentData, mapel, kelas, mapelId, kelasId, siswa: [], rataRataKelas: 0 }
  }

  // Students this tentor teaches for the selected mapel.
  const kelasUntukMapel = assignments
    .filter((a) => a.mapel_id === mapelId && (!kelasId || a.kelas_id === kelasId))
    .map((a) => a.kelas_id)

  const { data: siswaKelas } = kelasUntukMapel.length
    ? await supabase
        .from('siswa_kelas')
        .select('siswa_detail_id')
        .in('kelas_id', kelasUntukMapel)
        .is('deleted_at', null)
    : { data: [] as any[] }

  const siswaIds = new Set((siswaKelas ?? []).map((s) => s.siswa_detail_id))

  // Privat students are not in a kelas for this purpose, so the kelas filter skips them.
  if (!kelasId) {
    for (const p of privatAssignments) {
      if (p.mapel_id === mapelId) siswaIds.add(p.siswa_detail_id)
    }
  }

  if (siswaIds.size === 0) {
    return { ...parentData, mapel, kelas, mapelId, kelasId, siswa: [], rataRataKelas: 0 }
  }

  const ids = [...siswaIds]

  const { data: siswaRows } = await supabase
    .from('siswa_detail')
    .select('id, nis, profiles:profile_id(nama_lengkap)')
    .in('id', ids)
    .is('deleted_at', null)

  // Only try out attempts count here — latihan is practice and never a grade.
  const { data: attempts } = await supabase
    .from('attempt')
    .select('siswa_detail_id, nilai, submitted_at, try_out!inner(judul, materi!inner(mapel_id))')
    .in('siswa_detail_id', ids)
    .eq('try_out.materi.mapel_id', mapelId)
    .eq('is_active', true)
    .not('submitted_at', 'is', null)
    .is('deleted_at', null)

  const { data: manual } = await supabase
    .from('nilai_manual')
    .select('siswa_detail_id, nilai, judul, tanggal, tipe_test')
    .eq('mapel_id', mapelId)
    .in('siswa_detail_id', ids)
    .is('deleted_at', null)
    .order('tanggal', { ascending: false })

  const labelTipe: Record<string, string> = {
    pre_test: 'Pre-Test',
    post_test: 'Post-Test',
    try_out: 'Try Out'
  }

  const siswa = (siswaRows ?? [])
    .map((s: any) => {
      const nilaiTryOut = (attempts ?? [])
        .filter((a: any) => a.siswa_detail_id === s.id)
        .map((a: any) => ({
          nilai: a.nilai ?? 0,
          judul: a.try_out?.judul ?? 'Try Out',
          tanggal: a.submitted_at
        }))

      const nilaiManual = (manual ?? [])
        .filter((m: any) => m.siswa_detail_id === s.id)
        .map((m: any) => ({
          nilai: m.nilai,
          judul: m.judul,
          tipe: labelTipe[m.tipe_test] ?? m.tipe_test,
          tanggal: m.tanggal
        }))

      const semua = [...nilaiTryOut, ...nilaiManual].map((n) => n.nilai)
      const rataRata = semua.length
        ? Math.round(semua.reduce((a, b) => a + b, 0) / semua.length)
        : null

      return {
        id: s.id,
        nis: s.nis,
        nama: s.profiles?.nama_lengkap ?? '(tanpa nama)',
        nilaiTryOut,
        nilaiManual,
        rataRata
      }
    })
    .sort((a, b) => a.nama.localeCompare(b.nama))

  const denganNilai = siswa.map((s) => s.rataRata).filter((r): r is number => r !== null)
  const rataRataKelas = denganNilai.length
    ? Math.round(denganNilai.reduce((a, b) => a + b, 0) / denganNilai.length)
    : 0

  return { ...parentData, mapel, kelas, mapelId, kelasId, siswa, rataRataKelas }
}
