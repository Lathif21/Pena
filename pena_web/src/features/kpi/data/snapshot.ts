import { supabaseAdmin } from '$lib/supabase/admin.server'
import { gainTentor, kelengkapanJurnal, skorKpi } from './hitung.js'

export interface HasilKpi {
  tentorId: string
  gain: number | null
  jurnal: number | null
  skor: number
  jumlahSiswaDinilai: number
  jumlahSiswaDikecualikan: number
  jumlahSesi: number
  sesiBerjurnal: number
}

/** Bobot yang berlaku pada tanggal tertentu — bukan bobot hari ini. */
export async function konfigBerlaku(tahunAjaranId: string, pada: string) {
  const { data } = await supabaseAdmin
    .from('kpi_config')
    .select('bobot_gain, bobot_jurnal, periode')
    .eq('tahun_ajaran_id', tahunAjaranId)
    .lte('valid_from', pada)
    .is('deleted_at', null)
    // created_at ikut jadi pengurut: dua config dengan valid_from sama —
    // misalnya kepala guru mengubah bobot dua kali dalam sehari — akan dipilih
    // secara acak oleh Postgres tanpa pengurut kedua ini.
    .order('valid_from', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Default 60/40 dari kpi.md kalau kepala guru belum pernah menyimpan bobot.
  return data ?? { bobot_gain: 60, bobot_jurnal: 40, periode: 'bulanan' }
}

/**
 * Nilai pre/post yang jadi tanggung jawab satu tentor, dalam satu periode.
 *
 * Dipasangkan per (siswa, mapel), bukan per siswa saja: seorang siswa bisa
 * diajar tentor yang sama untuk dua mapel, dan memasangkan pre Matematika
 * dengan post IPA menghasilkan angka yang tidak berarti apa-apa.
 *
 * Dua sumber digabung. `nilai_manual` menyebut tentornya langsung. `attempt`
 * tidak punya kolom tentor, jadi atribusinya lewat kelas + mapel: try out
 * dimiliki materi, materi dimiliki mapel, dan tentor mengajar mapel itu di
 * kelas si siswa.
 */
export async function ambilPasanganNilai(tentorId: string, mulai: string, selesai: string) {
  // Hanya post-test yang dibatasi periode. Pre-test adalah garis dasar dan
  // hampir selalu berasal dari sebelum periode ini — membatasi keduanya ke
  // jendela yang sama membuat pre dan post tidak pernah berpasangan di periode
  // bulanan, dan gain selalu kosong. Yang diukur adalah "berapa banyak siswa
  // membaik pada periode ini dibanding titik awalnya", bukan "berapa banyak
  // yang pre dan post-nya kebetulan jatuh di bulan yang sama".
  const dalamJendela = (tipe: string, tgl: string) =>
    tipe === 'post_test' ? tgl >= mulai && tgl <= selesai : tgl <= selesai

  const { data: assign } = await supabaseAdmin
    .from('tentor_kelas_mapel')
    .select('kelas_id, mapel_id')
    .eq('tentor_id', tentorId)
    .is('deleted_at', null)

  const mapelIds = [...new Set((assign ?? []).map((a: any) => a.mapel_id))]
  const kelasIds = [...new Set((assign ?? []).map((a: any) => a.kelas_id))]

  // kunci = `${siswa}|${mapel}`, nilainya pre paling awal dan post paling akhir
  const pasangan = new Map<
    string,
    { siswaId: string; pre: number | null; preTgl: string; post: number | null; postTgl: string }
  >()

  const catat = (siswaId: string, mapelId: string, tipe: string, nilai: number, tgl: string) => {
    const k = `${siswaId}|${mapelId}`
    const p =
      pasangan.get(k) ?? { siswaId, pre: null, preTgl: '9999-99-99', post: null, postTgl: '' }

    if (tipe === 'pre_test' && tgl < p.preTgl) {
      p.pre = nilai
      p.preTgl = tgl
    }
    if (tipe === 'post_test' && tgl >= p.postTgl) {
      p.post = nilai
      p.postTgl = tgl
    }
    pasangan.set(k, p)
  }

  if (mapelIds.length > 0) {
    const { data: manual } = await supabaseAdmin
      .from('nilai_manual')
      .select('siswa_detail_id, mapel_id, tipe_test, nilai, tanggal')
      .eq('tentor_id', tentorId)
      .in('tipe_test', ['pre_test', 'post_test'])
      .lte('tanggal', selesai)
      .is('deleted_at', null)

    for (const n of (manual ?? []) as any[]) {
      if (!dalamJendela(n.tipe_test, n.tanggal)) continue
      catat(n.siswa_detail_id, n.mapel_id, n.tipe_test, n.nilai, n.tanggal)
    }
  }

  if (kelasIds.length > 0 && mapelIds.length > 0) {
    const { data: anggota } = await supabaseAdmin
      .from('siswa_kelas')
      .select('siswa_detail_id')
      .in('kelas_id', kelasIds)
      .is('deleted_at', null)

    const siswaIds = [...new Set((anggota ?? []).map((a: any) => a.siswa_detail_id))]

    if (siswaIds.length > 0) {
      const { data: attempt } = await supabaseAdmin
        .from('attempt')
        .select(`
          siswa_detail_id, nilai, submitted_at,
          try_out:try_out_id(tipe_test, materi:materi_id(mapel_id))
        `)
        .in('siswa_detail_id', siswaIds)
        .not('try_out_id', 'is', null)
        .not('nilai', 'is', null)
        .eq('is_active', true)
        .is('deleted_at', null)

      for (const a of (attempt ?? []) as any[]) {
        const tipe = a.try_out?.tipe_test
        const mapelId = a.try_out?.materi?.mapel_id
        if (tipe !== 'pre_test' && tipe !== 'post_test') continue
        if (!mapelId || !mapelIds.includes(mapelId)) continue

        const tgl = (a.submitted_at ?? '').slice(0, 10)
        if (!tgl || !dalamJendela(tipe, tgl)) continue
        catat(a.siswa_detail_id, mapelId, tipe, a.nilai, tgl)
      }
    }
  }

  return [...pasangan.values()]
}

/** Sesi tentor dalam periode, dan berapa di antaranya jurnalnya submitted. */
export async function ambilJurnal(tentorId: string, mulai: string, selesai: string) {
  const awal = new Date(`${mulai}T00:00:00+07:00`).toISOString()
  const akhir = new Date(`${selesai}T23:59:59+07:00`).toISOString()

  const { data: sesi } = await supabaseAdmin
    .from('sesi_mengajar')
    .select('id')
    .eq('tentor_id', tentorId)
    .gte('started_at', awal)
    .lte('started_at', akhir)
    .is('deleted_at', null)

  const ids = (sesi ?? []).map((s: any) => s.id)
  if (ids.length === 0) return { totalSesi: 0, sesiBerjurnal: 0 }

  const { data: jurnal } = await supabaseAdmin
    .from('jurnal_mengajar')
    .select('sesi_id')
    .in('sesi_id', ids)
    .eq('status', 'submitted')
    .is('deleted_at', null)

  return { totalSesi: ids.length, sesiBerjurnal: new Set((jurnal ?? []).map((j: any) => j.sesi_id)).size }
}

export async function hitungSnapshot(
  tentorId: string,
  mulai: string,
  selesai: string,
  tahunAjaranId: string
): Promise<HasilKpi> {
  const [pasangan, jurnalData, konfig] = await Promise.all([
    ambilPasanganNilai(tentorId, mulai, selesai),
    ambilJurnal(tentorId, mulai, selesai),
    konfigBerlaku(tahunAjaranId, selesai)
  ])

  const g = gainTentor(pasangan.map((p) => ({ pre: p.pre, post: p.post })))
  const jurnal = kelengkapanJurnal(jurnalData.totalSesi, jurnalData.sesiBerjurnal)

  return {
    tentorId,
    gain: g.gain,
    jurnal,
    skor: skorKpi(g.gain, jurnal, konfig.bobot_gain, konfig.bobot_jurnal),
    // Siswa yang berkontribusi, bukan jumlah pasangan: satu siswa dengan dua
    // mapel tetap satu siswa di mata kepala guru.
    jumlahSiswaDinilai: new Set(
      pasangan.filter((p) => p.pre !== null && p.post !== null && p.pre < 100).map((p) => p.siswaId)
    ).size,
    jumlahSiswaDikecualikan: g.jumlahDikecualikan,
    jumlahSesi: jurnalData.totalSesi,
    sesiBerjurnal: jurnalData.sesiBerjurnal
  }
}

/**
 * Menyimpan snapshot. Periode berjalan boleh ditimpa; periode yang sudah lewat
 * dibiarkan apa adanya oleh pemanggil — itulah gunanya snapshot.
 */
export async function simpanSnapshot(h: HasilKpi, mulai: string, selesai: string, tahunAjaranId: string) {
  const { error } = await supabaseAdmin.from('kpi_snapshot').upsert(
    {
      tentor_id: h.tentorId,
      periode_mulai: mulai,
      periode_selesai: selesai,
      nilai_gain: h.gain,
      nilai_jurnal: h.jurnal,
      skor: h.skor,
      jumlah_siswa_dinilai: h.jumlahSiswaDinilai,
      jumlah_sesi: h.jumlahSesi,
      tahun_ajaran_id: tahunAjaranId
    },
    { onConflict: 'tentor_id,periode_mulai,tahun_ajaran_id' }
  )

  if (error) throw new Error(error.message)
}
