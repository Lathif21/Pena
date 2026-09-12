import { supabaseAdmin } from '$lib/supabase/admin.server'
import { kirimReliefBaru, kirimReliefDibatalkan } from '$lib/email/relief'
import { hariIni } from '$lib/utils/tanggal'

export { hariIni }


export interface ReliefAktif {
  id: string
  kelas_id: string
  mapel_id: string
  tanggal: string
  task: string
  tentor_asli_id: string
}

/**
 * Jalur otorisasi kedua untuk membuka sesi: ada relief aktif hari ini dengan
 * tentor pemanggil sebagai pengganti.
 *
 * Hanya berlaku pada tanggal yang tertulis. Lewat tengah malam izinnya habis
 * sendiri — tidak ada pencabutan manual, dan tidak boleh ada.
 */
export async function adaReliefAktif(
  penggantiId: string,
  kelasId: string,
  mapelId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('relief')
    .select('id')
    .eq('pengganti_id', penggantiId)
    .eq('kelas_id', kelasId)
    .eq('mapel_id', mapelId)
    .eq('tanggal', hariIni())
    .eq('status', 'aktif')
    .is('deleted_at', null)
    .limit(1)

  return (data ?? []).length > 0
}

/** Semua relief aktif hari ini untuk pengganti ini — dipakai dropdown dan banner. */
export async function reliefHariIni(penggantiId: string): Promise<ReliefAktif[]> {
  const { data } = await supabaseAdmin
    .from('relief')
    .select('id, kelas_id, mapel_id, tanggal, task, tentor_asli_id')
    .eq('pengganti_id', penggantiId)
    .eq('tanggal', hariIni())
    .eq('status', 'aktif')
    .is('deleted_at', null)

  return (data ?? []) as ReliefAktif[]
}

export interface SesiRelief {
  id: string
  status: 'open' | 'closed'
}

/**
 * Sesi yang dibuka lewat relief ini, kalau ada.
 *
 * `sesi_mengajar` tidak menyimpan relief_id, jadi kecocokannya lewat
 * pengganti + kelas + mapel + tanggal — kombinasi yang sama dengan yang dipakai
 * saat mengizinkan sesi itu dibuka.
 *
 * Statusnya, bukan hanya ada-tidaknya: banner dashboard perlu membedakan "belum
 * mulai", "sedang berjalan", dan "sudah selesai".
 */
export async function sesiUntukRelief(relief: {
  pengganti_id: string
  kelas_id: string
  mapel_id: string
  tanggal: string
}): Promise<SesiRelief | null> {
  const mulai = new Date(`${relief.tanggal}T00:00:00+07:00`)
  const habis = new Date(mulai.getTime() + 24 * 60 * 60 * 1000)

  const { data } = await supabaseAdmin
    .from('sesi_mengajar')
    .select('id, status')
    .eq('tentor_id', relief.pengganti_id)
    .eq('kelas_id', relief.kelas_id)
    .eq('mapel_id', relief.mapel_id)
    .gte('started_at', mulai.toISOString())
    .lt('started_at', habis.toISOString())
    .is('deleted_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as SesiRelief) ?? null
}

/** Dipakai pembatalan: relief terkunci begitu penggantinya membuka sesi. */
export async function adaSesiLewatRelief(relief: {
  pengganti_id: string
  kelas_id: string
  mapel_id: string
  tanggal: string
}): Promise<boolean> {
  return (await sesiUntukRelief(relief)) !== null
}

/**
 * Mengirim notifikasi dan menelan kegagalannya.
 *
 * Kegagalan SMTP tidak boleh membatalkan relief: penggantinya sudah berwenang
 * membuka sesi, dan menggagalkan seluruh pengajuan karena mail server mati akan
 * membuat fitur ini tidak bisa diandalkan justru saat paling dibutuhkan.
 * Pesannya disimpan di `relief.email_error` supaya tentor asli tahu dia perlu
 * mengabari penggantinya manual.
 */
export async function kirimNotifikasi(
  jenis: 'baru' | 'dibatalkan',
  relief: { id: string; tanggal: string; task: string; kelas?: any; mapel?: any },
  tentorAsliId: string,
  pengganti: { nama_lengkap: string; email: string },
  origin: string
): Promise<string | null> {
  try {
    const [{ data: asli }, { data: kgList }] = await Promise.all([
      supabaseAdmin.from('profiles').select('nama_lengkap').eq('id', tentorAsliId).maybeSingle(),
      supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('role', 'kepala_guru')
        .is('deleted_at', null)
    ])

    // Dua penerima per pengajuan: pengganti dan kepala guru.
    const kepada = [pengganti.email, ...(kgList ?? []).map((k: any) => k.email)].filter(Boolean)

    const isi = {
      tentorAsliNama: asli?.nama_lengkap ?? '(tanpa nama)',
      penggantiNama: pengganti.nama_lengkap,
      kelasNama: relief.kelas?.nama ?? '',
      mapelNama: relief.mapel?.nama ?? '',
      tanggal: relief.tanggal,
      task: relief.task,
      kepada,
      origin
    }

    if (jenis === 'baru') await kirimReliefBaru(isi)
    else await kirimReliefDibatalkan(isi)

    return null
  } catch (err) {
    const pesan = err instanceof Error ? err.message : 'Gagal mengirim email'
    await supabaseAdmin.from('relief').update({ email_error: pesan }).eq('id', relief.id)
    return pesan
  }
}

export interface ReliefLengkap {
  id: string
  /** Sesi yang sudah dibuka lewat relief ini — null kalau belum mulai. */
  sesi: SesiRelief | null
  kelasId: string
  kelasNama: string
  mapelId: string
  mapelNama: string
  task: string
  tentorAsliNama: string
}

/**
 * Relief aktif hari ini untuk pengganti ini, lengkap dengan nama-nama.
 *
 * Memakai client milik request (bukan admin) karena ini dipanggil dari `load`,
 * dan datanya memang milik pemanggil sendiri. Otorisasi pembukaan sesi tetap
 * lewat `adaReliefAktif`, yang berjalan di endpoint dengan hak admin.
 */
export async function reliefHariIniLengkap(
  supabase: { from: (t: string) => any },
  penggantiId: string
): Promise<ReliefLengkap[]> {
  const { data } = await supabase
    .from('relief')
    .select(`
      id, task, kelas_id, mapel_id,
      kelas:kelas_id(nama), mapel:mapel_id(nama), tentorAsli:tentor_asli_id(nama_lengkap)
    `)
    .eq('pengganti_id', penggantiId)
    .eq('tanggal', hariIni())
    .eq('status', 'aktif')
    .is('deleted_at', null)

  return await Promise.all(
    (data ?? []).map(async (r: any) => ({
      id: r.id,
      sesi: await sesiUntukRelief({
        pengganti_id: penggantiId,
        kelas_id: r.kelas_id,
        mapel_id: r.mapel_id,
        tanggal: hariIni()
      }),
      kelasId: r.kelas_id,
      kelasNama: r.kelas?.nama ?? '',
      mapelId: r.mapel_id,
      mapelNama: r.mapel?.nama ?? '',
      task: r.task,
      tentorAsliNama: r.tentorAsli?.nama_lengkap ?? '(tanpa nama)'
    }))
  )
}
