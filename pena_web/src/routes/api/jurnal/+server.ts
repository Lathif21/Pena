import { pesanRamah } from '$lib/utils/pesan'
import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { sesiMilikPemanggil } from '$lib/supabase/sesi.server'

/**
 * Menyimpan jurnal sebagai draft. Statusnya baru berubah jadi `submitted` saat
 * Selesai Mengajar dijalankan — bukan di sini.
 *
 * Upsert pada sesi_id: jurnal kedua untuk sesi yang sama tidak akan pernah
 * terbentuk, dan itu dijamin unique constraint, bukan cuma oleh kode ini.
 */
export async function POST({ request, cookies }) {
  const { sesiId, materiId, deskripsi } = await request.json().catch(() => ({}))

  if (!sesiId) throw svelteError(400, 'Sesi tidak dikenali. Muat ulang halaman lalu coba lagi.')
  if (!materiId) throw svelteError(400, 'Materi wajib dipilih')
  if (typeof deskripsi !== 'string' || !deskripsi.trim()) {
    throw svelteError(400, 'Deskripsi wajib diisi')
  }

  const { sesi } = await sesiMilikPemanggil(cookies, sesiId, { harusOpen: true })

  // Materi harus berasal dari mapel sesi ini — dropdown sudah difilter, tapi
  // klien bisa mengirim id apa pun.
  const { data: materi } = await supabaseAdmin
    .from('materi')
    .select('id')
    .eq('id', materiId)
    .eq('mapel_id', sesi.mapel_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!materi) throw svelteError(400, 'Materi bukan bagian dari mapel sesi ini')

  const { data, error } = await supabaseAdmin
    .from('jurnal_mengajar')
    .upsert(
      {
        sesi_id: sesi.id,
        materi_id: materiId,
        deskripsi: deskripsi.trim(),
        status: 'draft',
        tahun_ajaran_id: sesi.tahun_ajaran_id
      },
      { onConflict: 'sesi_id' }
    )
    .select()
    .single()

  if (error) throw svelteError(400, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  return json(data)
}
