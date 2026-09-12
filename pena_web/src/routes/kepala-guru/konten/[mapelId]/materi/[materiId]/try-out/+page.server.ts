import { pesanRamah } from '$lib/utils/pesan'
import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, params, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const { data: materi, error: materiError } = await supabase
    .from('materi')
    .select('id, nama, mapel_id')
    .eq('id', params.materiId)
    .is('deleted_at', null)
    .single()

  if (materiError || !materi) throw materiError || new Error('Materi not found')

  const { data: mapel, error: mapelError } = await supabase
    .from('mapel')
    .select('id, nama')
    .eq('id', materi.mapel_id)
    .is('deleted_at', null)
    .single()

  if (mapelError || !mapel) throw mapelError || new Error('Mapel not found')

  const { data: tryOutData, error: tryOutError } = await supabase
    .from('try_out')
    .select('id, judul, tipe_test, waktu_buka, durasi_menit, status, published_at')
    .eq('materi_id', params.materiId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (tryOutError) throw tryOutError

  // Target try out hanya kelas yang memang memakai mapel ini (relasi mapel_kelas)
  const { data: mapelKelas, error: kelasError } = await supabase
    .from('mapel_kelas')
    .select('kelas:kelas_id(id, nama, deleted_at)')
    .eq('mapel_id', mapel.id)

  if (kelasError) throw kelasError

  const kelas = (mapelKelas ?? [])
    .map((mk: any) => mk.kelas)
    .filter((k: any) => k && !k.deleted_at)
    .sort((a: any, b: any) => a.nama.localeCompare(b.nama))

  const tryOutIds = tryOutData?.map(t => t.id) || []
  let tryOutKelasData: any[] = []

  if (tryOutIds.length > 0) {
    const { data, error } = await supabase
      .from('try_out_kelas')
      .select('try_out_id, kelas_id')
      .in('try_out_id', tryOutIds)

    if (error) throw svelteError(500, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))
    tryOutKelasData = data || []
  }

  const kelasPerTryOut = new Map<string, string[]>()
  tryOutKelasData.forEach(tk => {
    if (!kelasPerTryOut.has(tk.try_out_id)) {
      kelasPerTryOut.set(tk.try_out_id, [])
    }
    kelasPerTryOut.get(tk.try_out_id)?.push(tk.kelas_id)
  })

  const now = Date.now()
  const tryOut = (tryOutData || []).map(t => {
    const tutup = new Date(t.waktu_buka).getTime() + t.durasi_menit * 60000
    return {
      ...t,
      kelasIds: kelasPerTryOut.get(t.id) || [],
      // Expired means the window has closed: results are real, so it can no longer
      // be unpublished and its soal are frozen.
      expired: now > tutup,
      waktuTutup: tutup,
      // Soal belong to one try out now, so the lock is per try out — publishing one
      // no longer freezes its siblings on the same materi. Mirrors tryOutSoalLock.
      soalLock:
        t.status !== 'published'
          ? { locked: false, reason: '' }
          : now > tutup
            ? { locked: true, reason: 'Try out sudah selesai — soal tidak bisa diubah lagi' }
            : { locked: true, reason: 'Batalkan publish try out dulu sebelum mengubah soal' }
    }
  })

  return {
    ...parentData,
    mapel,
    materi,
    tryOut,
    kelas
  }
}
