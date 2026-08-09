import { supabase } from '$lib/supabase/client'

export interface TryOut {
  id: string
  materi_id: string
  judul: string
  tipe_test: 'biasa' | 'pre_test' | 'post_test'
  waktu_buka: string
  durasi_menit: number
  status: 'draft' | 'published'
  published_at: string | null
}

export async function createTryOut(
  materiId: string,
  judul: string,
  tipeTest: 'biasa' | 'pre_test' | 'post_test',
  waktuBuka: string,
  durasiMenit: number,
  kelasIds: string[],
  tahunAjaranId: string
) {
  // Validasi pre_test: check belum ada pre_test lain untuk mapel yang sama
  if (tipeTest === 'pre_test') {
    const { data: materi } = await supabase
      .from('materi')
      .select('mapel_id')
      .eq('id', materiId)
      .single()

    if (materi) {
      const { data: existing } = await supabase
        .from('try_out')
        .select('id')
        .eq('materi_id', materi.mapel_id)
        .eq('tipe_test', 'pre_test')
        .eq('tahun_ajaran_id', tahunAjaranId)
        .is('deleted_at', null)

      if (existing && existing.length > 0) {
        throw new Error('Sudah ada pre_test untuk mapel ini')
      }
    }
  }

  const { data: tryOut, error: tryOutError } = await supabase
    .from('try_out')
    .insert([{
      materi_id: materiId,
      judul,
      tipe_test: tipeTest,
      waktu_buka: waktuBuka,
      durasi_menit: durasiMenit,
      tahun_ajaran_id: tahunAjaranId,
      status: 'draft'
    }])
    .select()
    .single()

  if (tryOutError) throw tryOutError

  if (kelasIds.length > 0) {
    const tryOutKelasData = kelasIds.map(kelasId => ({
      try_out_id: tryOut.id,
      kelas_id: kelasId
    }))

    const { error: kelasError } = await supabase
      .from('try_out_kelas')
      .insert(tryOutKelasData)

    if (kelasError) throw kelasError
  }

  return tryOut
}

export async function publishTryOut(tryOutId: string) {
  // Check if there are any soal
  const { data: soal, error: soalError } = await supabase
    .from('soal')
    .select('id')
    .eq('materi_id', (await supabase.from('try_out').select('materi_id').eq('id', tryOutId).single()).data.materi_id)
    .is('deleted_at', null)

  if (soalError) throw soalError
  if (!soal || soal.length === 0) {
    throw new Error('Try out harus memiliki minimal 1 soal')
  }

  const { error } = await supabase
    .from('try_out')
    .update({
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', tryOutId)

  if (error) throw error
}

export async function getTryOut(tryOutId: string): Promise<TryOut | null> {
  const { data, error } = await supabase
    .from('try_out')
    .select('*')
    .eq('id', tryOutId)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

export async function getTryOutKelas(tryOutId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('try_out_kelas')
    .select('kelas_id')
    .eq('try_out_id', tryOutId)

  if (error) throw error
  return data?.map(d => d.kelas_id) || []
}
