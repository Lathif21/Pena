import { pesanRamah } from '$lib/utils/pesan'
import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { sesiMilikPemanggil } from '$lib/supabase/sesi.server'
import { validateFoto, fotoPath, uploadFoto, hapusFoto } from '$features/attendance/data/sesi.server'

/**
 * Mengganti foto presensi. Hanya selagi sesi masih `open` — begitu ditutup,
 * bukti kehadiran ikut terkunci bersama presensi murid dan jurnal.
 */
export async function POST({ request, cookies, params }) {
  const { sesi } = await sesiMilikPemanggil(cookies, params.id, { harusOpen: true })
  const { data: lama } = await supabaseAdmin
    .from('sesi_mengajar')
    .select('foto_path')
    .eq('id', sesi.id)
    .single()

  const form = await request.formData().catch(() => null)
  if (!form) throw svelteError(400, 'Form tidak valid')

  const foto = form.get('foto')
  validateFoto(foto)

  const path = fotoPath(sesi.tahun_ajaran_id, sesi.id, foto)
  await uploadFoto(path, foto)

  // Ekstensi bisa berubah (JPG diganti PNG), jadi path dan uploaded_at ikut
  // diperbarui — kalau tidak, baris menunjuk file lama yang sudah tertimpa.
  const { data, error } = await supabaseAdmin
    .from('sesi_mengajar')
    .update({ foto_path: path, uploaded_at: new Date().toISOString() })
    .eq('id', sesi.id)
    .select()
    .single()

  if (error) throw svelteError(400, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  // JPG diganti PNG berarti path berubah, dan file lama tidak tertimpa oleh
  // upsert — buang supaya tidak tertinggal yatim di bucket.
  if (lama?.foto_path && lama.foto_path !== path) await hapusFoto(lama.foto_path)

  return json(data)
}
