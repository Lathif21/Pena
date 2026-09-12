import { createSupabaseServerClient } from '$lib/supabase/server'

interface NilaiRingkas {
  siswaDetailId: string
  nama: string
  nis: string
  kelasNama: string
  paket: string
  tryOut: number[]
  manual: number[]
}

const rata = (angka: number[]) =>
  angka.length === 0 ? null : Math.round(angka.reduce((a, b) => a + b, 0) / angka.length)

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const { data: siswaRows } = await supabase
    .from('profiles')
    .select(`
      id, nama_lengkap,
      siswa_detail:siswa_detail(
        id, nis, paket,
        siswa_kelas(deleted_at, kelas:kelas_id(nama))
      )
    `)
    .eq('role', 'siswa')
    .is('deleted_at', null)
    .order('nama_lengkap')

  // Hanya attempt try out yang dihitung. Attempt latihan (sub_materi_id terisi)
  // memang tersimpan, tapi latihan tidak pernah masuk hitungan nilai.
  const { data: attemptRows } = await supabase
    .from('attempt')
    .select(`
      siswa_detail_id, nilai, submitted_at,
      try_out:try_out_id(judul, tipe_test, materi:materi_id(mapel:mapel_id(id, nama)))
    `)
    .not('try_out_id', 'is', null)
    .not('nilai', 'is', null)
    .eq('is_active', true)
    .is('deleted_at', null)

  const { data: manualRows } = await supabase
    .from('nilai_manual')
    .select('siswa_detail_id, nilai, tipe_test, judul, tanggal, mapel:mapel_id(id, nama)')
    .is('deleted_at', null)

  const { data: mapelRows } = await supabase
    .from('mapel')
    .select('id, nama')
    .is('deleted_at', null)
    .order('nama')

  const perSiswa = new Map<string, NilaiRingkas>()

  for (const p of (siswaRows ?? []) as any[]) {
    const detail = p.siswa_detail?.[0]
    if (!detail) continue
    const enrolment = (detail.siswa_kelas ?? []).find((sk: any) => !sk.deleted_at)

    perSiswa.set(detail.id, {
      siswaDetailId: detail.id,
      nama: p.nama_lengkap,
      nis: detail.nis ?? '',
      kelasNama: enrolment?.kelas?.nama ?? '',
      paket: detail.paket ?? 'regular',
      tryOut: [],
      manual: []
    })
  }

  // Nilai per mapel dipakai dua kali: kolom filter di halaman ini dan ringkasan
  // di dashboard. Dikumpulkan sekali di sini.
  const perMapel = new Map<string, { nama: string; angka: number[] }>()

  const catat = (mapel: any, nilai: number) => {
    if (!mapel?.id) return
    const baris = perMapel.get(mapel.id) ?? { nama: mapel.nama, angka: [] }
    baris.angka.push(nilai)
    perMapel.set(mapel.id, baris)
  }

  for (const a of (attemptRows ?? []) as any[]) {
    perSiswa.get(a.siswa_detail_id)?.tryOut.push(a.nilai)
    catat(a.try_out?.materi?.mapel, a.nilai)
  }

  for (const n of (manualRows ?? []) as any[]) {
    perSiswa.get(n.siswa_detail_id)?.manual.push(n.nilai)
    catat(n.mapel, n.nilai)
  }

  const siswa = [...perSiswa.values()].map((s) => {
    const semua = [...s.tryOut, ...s.manual]
    return {
      siswaDetailId: s.siswaDetailId,
      nama: s.nama,
      nis: s.nis,
      kelasNama: s.kelasNama,
      paket: s.paket,
      jumlahTryOut: s.tryOut.length,
      rataTryOut: rata(s.tryOut),
      jumlahManual: s.manual.length,
      rataManual: rata(s.manual),
      rataGabungan: rata(semua)
    }
  })

  const kelas = [...new Set(siswa.map((s) => s.kelasNama).filter(Boolean))].sort()

  const mapel = (mapelRows ?? []).map((m: any) => ({
    id: m.id,
    nama: m.nama,
    rata: rata(perMapel.get(m.id)?.angka ?? []),
    jumlah: perMapel.get(m.id)?.angka.length ?? 0
  }))

  return { ...parentData, siswa, kelas, mapel }
}
