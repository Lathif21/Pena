import { createSupabaseServerClient } from '$lib/supabase/server'
import { hariIni, periodeBulanan } from '$lib/utils/tanggal'
import { hitungSnapshot, konfigBerlaku } from '$features/kpi/data/snapshot'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const tentorId = parentData.user.id
  const tahunAjaranId = parentData.profile.tahun_ajaran_id

  const { mulai, selesai } = periodeBulanan(hariIni())

  // Dihitung untuk tentor ini saja, dan TIDAK disimpan sebagai snapshot:
  // snapshot adalah catatan kepala guru. Kalau halaman tentor ikut menulisnya,
  // angka periode berjalan berubah tiap kali seorang tentor membuka halamannya
  // sendiri — dan kepala guru tidak akan tahu kenapa.
  const h = await hitungSnapshot(tentorId, mulai, selesai, tahunAjaranId)
  const konfig = await konfigBerlaku(tahunAjaranId, selesai)

  // Riwayat dari snapshot resmi — periode lampau memang milik kepala guru.
  const { data: riwayat } = await supabase
    .from('kpi_snapshot')
    .select('periode_mulai, nilai_gain, nilai_jurnal, skor, jumlah_siswa_dinilai, jumlah_sesi')
    .eq('tentor_id', tentorId)
    .eq('tahun_ajaran_id', tahunAjaranId)
    .lt('periode_mulai', mulai)
    .is('deleted_at', null)
    .order('periode_mulai', { ascending: false })
    .limit(6)

  return {
    ...parentData,
    kpi: h,
    periode: { mulai, selesai },
    konfig,
    riwayat: (riwayat ?? []).map((r: any) => ({
      periodeMulai: r.periode_mulai,
      gain: r.nilai_gain === null ? null : Number(r.nilai_gain),
      jurnal: r.nilai_jurnal === null ? null : Number(r.nilai_jurnal),
      skor: Number(r.skor),
      jumlahSiswaDinilai: r.jumlah_siswa_dinilai,
      jumlahSesi: r.jumlah_sesi
    }))
  }
}
