import type { SupabaseClient } from '@supabase/supabase-js'
import type { Anak, Titik, NilaiAnak, KehadiranAnak } from './types'

export type { Anak, Titik, NilaiAnak, KehadiranAnak }

/**
 * Anak yang benar-benar tertaut ke wali ini.
 *
 * Tidak ada RLS di proyek ini, jadi penyaringan di sinilah satu-satunya yang
 * menahan seorang wali membaca nilai dan kehadiran anak orang lain. Setiap load
 * di /wali wajib lewat sini dan hanya boleh mengerjakan id yang dikembalikannya
 * — jangan pernah percaya id anak yang datang dari query string.
 */
export async function listAnak(supabase: SupabaseClient, waliId: string): Promise<Anak[]> {
  const { data } = await supabase
    .from('wali_siswa')
    .select(`
      siswa_detail_id,
      siswa_detail:siswa_detail_id(
        id, nis, paket,
        profile:profile_id(nama_lengkap),
        siswa_kelas(deleted_at, kelas:kelas_id(nama))
      )
    `)
    .eq('wali_id', waliId)
    .is('deleted_at', null)

  return (data ?? [])
    .map((row: any) => {
      const detail = row.siswa_detail
      if (!detail) return null
      const enrolment = (detail.siswa_kelas ?? []).find((sk: any) => !sk.deleted_at)

      return {
        siswaDetailId: detail.id,
        nama: detail.profile?.nama_lengkap ?? '(tanpa nama)',
        nis: detail.nis ?? '',
        kelasNama: enrolment?.kelas?.nama ?? '',
        paket: detail.paket ?? 'regular'
      }
    })
    .filter((a): a is Anak => a !== null)
    .sort((a, b) => a.nama.localeCompare(b.nama))
}

/**
 * Anak yang dipilih lewat query string, tapi hanya kalau memang milik wali ini.
 * Kalau id-nya tidak dikenali, jatuh ke anak pertama — bukan ditolak, karena
 * tautan basi setelah anak pindah kelas bukan kesalahan penggunanya.
 */
export function pilihAnak(daftar: Anak[], diminta: string | null): Anak | null {
  if (daftar.length === 0) return null
  return daftar.find((a) => a.siswaDetailId === diminta) ?? daftar[0]
}

const rata = (angka: number[]) =>
  angka.length === 0 ? null : Math.round(angka.reduce((a, b) => a + b, 0) / angka.length)

/**
 * Nilai satu anak, dikelompokkan per mapel.
 *
 * Latihan tidak pernah ikut — boleh diulang tanpa batas sehingga angkanya tidak
 * sebanding, dan CLAUDE.md menyatakan latihan tidak pernah masuk progress wali.
 */
export async function nilaiAnak(
  supabase: SupabaseClient,
  siswaDetailId: string
): Promise<NilaiAnak> {
  const [{ data: attemptRows }, { data: manualRows }] = await Promise.all([
    supabase
      .from('attempt')
      .select(`
        nilai, submitted_at,
        try_out:try_out_id(judul, materi:materi_id(mapel:mapel_id(id, nama)))
      `)
      .eq('siswa_detail_id', siswaDetailId)
      .not('try_out_id', 'is', null)
      .not('nilai', 'is', null)
      .eq('is_active', true)
      .is('deleted_at', null),
    supabase
      .from('nilai_manual')
      .select('nilai, judul, tanggal, mapel:mapel_id(id, nama)')
      .eq('siswa_detail_id', siswaDetailId)
      .is('deleted_at', null)
  ])

  const perMapel = new Map<string, { nama: string; nilai: Titik[] }>()

  const catat = (mapel: any, titik: Titik) => {
    if (!mapel?.id) return
    const baris = perMapel.get(mapel.id) ?? { nama: mapel.nama, nilai: [] }
    baris.nilai.push(titik)
    perMapel.set(mapel.id, baris)
  }

  for (const a of (attemptRows ?? []) as any[]) {
    catat(a.try_out?.materi?.mapel, {
      judul: a.try_out?.judul ?? 'Try out',
      nilai: a.nilai,
      tanggal: a.submitted_at,
      sumber: 'try_out'
    })
  }

  for (const n of (manualRows ?? []) as any[]) {
    catat(n.mapel, { judul: n.judul, nilai: n.nilai, tanggal: n.tanggal, sumber: 'manual' })
  }

  const semua: number[] = []

  const hasil = [...perMapel.entries()]
    .map(([mapelId, baris]) => {
      // Urut waktu supaya grafiknya terbaca sebagai perkembangan, bukan acak.
      const nilai = baris.nilai.sort(
        (x, y) => new Date(x.tanggal ?? 0).getTime() - new Date(y.tanggal ?? 0).getTime()
      )
      semua.push(...nilai.map((t) => t.nilai))
      return { mapelId, nama: baris.nama, rata: rata(nilai.map((t) => t.nilai)), nilai }
    })
    .sort((a, b) => a.nama.localeCompare(b.nama))

  return { perMapel: hasil, rataKeseluruhan: rata(semua), jumlah: semua.length }
}

/** Kehadiran satu anak. Siswa privat tidak punya presensi sama sekali. */
export async function kehadiranAnak(
  supabase: SupabaseClient,
  siswaDetailId: string
): Promise<KehadiranAnak> {
  const { data } = await supabase
    .from('presensi_murid')
    .select(`
      id, is_hadir,
      sesi:sesi_id(started_at, tentor:tentor_id(nama_lengkap), kelas:kelas_id(nama), mapel:mapel_id(nama))
    `)
    .eq('siswa_detail_id', siswaDetailId)

  const baris = (data ?? [])
    .map((p: any) => ({
      id: p.id,
      tanggal: p.sesi?.started_at ?? null,
      kelasNama: p.sesi?.kelas?.nama ?? '',
      mapelNama: p.sesi?.mapel?.nama ?? '',
      tentorNama: p.sesi?.tentor?.nama_lengkap ?? '',
      hadir: p.is_hadir
    }))
    .sort((a, b) => new Date(b.tanggal ?? 0).getTime() - new Date(a.tanggal ?? 0).getTime())

  const hadir = baris.filter((b) => b.hadir).length
  const total = baris.length

  return { total, hadir, persen: total === 0 ? null : Math.round((hadir / total) * 100), baris }
}
