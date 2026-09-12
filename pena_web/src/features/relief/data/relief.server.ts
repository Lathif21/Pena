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

/**
 * Sudah adakah sesi yang dibuka lewat relief ini?
 *
 * Dipakai pembatalan: setelah pengganti membuka sesi, membatalkan relief akan
 * meninggalkan sesi itu tanpa dasar otorisasi. `sesi_mengajar` tidak menyimpan
 * relief_id, jadi kecocokannya lewat pengganti + kelas + mapel + tanggal —
 * kombinasi yang sama dengan yang dipakai saat mengizinkan sesi itu dibuka.
 */
export async function adaSesiLewatRelief(relief: {
  pengganti_id: string
  kelas_id: string
  mapel_id: string
  tanggal: string
}): Promise<boolean> {
  const mulai = new Date(`${relief.tanggal}T00:00:00+07:00`)
  const habis = new Date(mulai.getTime() + 24 * 60 * 60 * 1000)

  const { data } = await supabaseAdmin
    .from('sesi_mengajar')
    .select('id')
    .eq('tentor_id', relief.pengganti_id)
    .eq('kelas_id', relief.kelas_id)
    .eq('mapel_id', relief.mapel_id)
    .gte('started_at', mulai.toISOString())
    .lt('started_at', habis.toISOString())
    .is('deleted_at', null)
    .limit(1)

  return (data ?? []).length > 0
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
