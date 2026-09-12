import { createSupabaseServerClient } from '$lib/supabase/server'
import { hariIni, periodeBulanan } from '$lib/utils/tanggal'
import { hitungSnapshot, simpanSnapshot, konfigBerlaku } from '$features/kpi/data/snapshot'

export async function load({ cookies, parent, url }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const tahunAjaranId = parentData.profile.tahun_ajaran_id

  // Periode dari query string, default bulan berjalan menurut WIB.
  const acuan = url.searchParams.get('periode') ?? hariIni()
  const { mulai, selesai } = periodeBulanan(acuan)
  const periodeBerjalan = selesai >= hariIni()
  const hitungUlang = url.searchParams.get('hitung') === '1'

  const { data: tentorRows } = await supabase
    .from('profiles')
    .select('id, nama_lengkap')
    .eq('role', 'tentor')
    .is('deleted_at', null)
    .order('nama_lengkap')

  const { data: snapshotRows } = await supabase
    .from('kpi_snapshot')
    .select('*')
    .eq('periode_mulai', mulai)
    .eq('tahun_ajaran_id', tahunAjaranId)
    .is('deleted_at', null)

  const tersimpan = new Map((snapshotRows ?? []).map((s: any) => [s.tentor_id, s]))

  // Periode lampau yang snapshot-nya sudah ada tidak dihitung ulang otomatis —
  // itulah gunanya snapshot: angka masa lalu tetap stabil meski bobot berubah.
  // Hitung Ulang hanya berlaku untuk periode berjalan.
  const perluHitung = (tentorId: string) =>
    (hitungUlang && periodeBerjalan) || !tersimpan.has(tentorId)

  const tentor = await Promise.all(
    (tentorRows ?? []).map(async (t: any) => {
      if (!perluHitung(t.id)) {
        const s = tersimpan.get(t.id)
        return {
          id: t.id,
          nama: t.nama_lengkap,
          gain: s.nilai_gain === null ? null : Number(s.nilai_gain),
          jurnal: s.nilai_jurnal === null ? null : Number(s.nilai_jurnal),
          skor: Number(s.skor),
          jumlahSiswaDinilai: s.jumlah_siswa_dinilai,
          jumlahSiswaDikecualikan: null as number | null,
          jumlahSesi: s.jumlah_sesi,
          sesiBerjurnal: null as number | null,
          dariSnapshot: true
        }
      }

      const h = await hitungSnapshot(t.id, mulai, selesai, tahunAjaranId)
      await simpanSnapshot(h, mulai, selesai, tahunAjaranId)

      return {
        id: t.id,
        nama: t.nama_lengkap,
        gain: h.gain,
        jurnal: h.jurnal,
        skor: h.skor,
        jumlahSiswaDinilai: h.jumlahSiswaDinilai,
        jumlahSiswaDikecualikan: h.jumlahSiswaDikecualikan,
        jumlahSesi: h.jumlahSesi,
        sesiBerjurnal: h.sesiBerjurnal,
        dariSnapshot: false
      }
    })
  )

  const konfig = await konfigBerlaku(tahunAjaranId, selesai)

  return { ...parentData, tentor, periode: { mulai, selesai, berjalan: periodeBerjalan }, konfig }
}
