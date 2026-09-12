import { pesanRamah } from '$lib/utils/pesan'
import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getPengajar, mengajarKelasMapel } from '$lib/supabase/sesi.server'
import { validateFoto, fotoPath, uploadFoto, hapusFoto } from '$features/attendance/data/sesi.server'
import { adaReliefAktif } from '$features/relief/data/relief.server'

/**
 * Membuka sesi mengajar. Mengunggah foto presensi *adalah* pencatatan kehadiran
 * tentor — tidak ada langkah check-in terpisah.
 *
 * Otorisasi punya dua jalur: tentor terdaftar di tentor_kelas_mapel, atau ada
 * relief aktif hari ini yang menunjuknya sebagai pengganti. Peran `tentor` saja
 * tidak pernah cukup.
 */
export async function POST({ request, cookies }) {
  const profile = await getPengajar(cookies)

  const form = await request.formData().catch(() => null)
  if (!form) throw svelteError(400, 'Form tidak valid')

  const kelasId = form.get('kelasId')
  const mapelId = form.get('mapelId')
  const foto = form.get('foto')

  if (typeof kelasId !== 'string' || !kelasId) throw svelteError(400, 'Kelas wajib dipilih')
  if (typeof mapelId !== 'string' || !mapelId) throw svelteError(400, 'Mapel wajib dipilih')
  validateFoto(foto)

  // Jalur relief hanya berlaku pada tanggal yang tertulis di barisnya. Lewat
  // tengah malam izinnya habis sendiri — tidak ada pencabutan manual.
  const boleh =
    (await mengajarKelasMapel(profile.id, kelasId, mapelId)) ||
    (await adaReliefAktif(profile.id, kelasId, mapelId))

  if (!boleh) throw svelteError(403, 'Anda tidak mengajar kelas ini')

  // Satu sesi berjalan pada satu waktu: presensi murid dan jurnal semuanya
  // menggantung pada "sesi aktif", jadi dua sesi open sekaligus membuat halaman
  // itu ambigu. Tutup dulu yang sedang berjalan, baru buka kelas berikutnya.
  const { data: berjalan } = await supabaseAdmin
    .from('sesi_mengajar')
    .select('id')
    .eq('tentor_id', profile.id)
    .eq('status', 'open')
    .is('deleted_at', null)
    .limit(1)

  if ((berjalan ?? []).length > 0) {
    throw svelteError(409, 'Masih ada sesi berjalan — selesaikan dulu sebelum membuka sesi baru')
  }

  // Id dibuat lebih dulu supaya path foto bisa memuatnya tanpa insert dua tahap.
  const sesiId = crypto.randomUUID()
  const path = fotoPath(profile.tahun_ajaran_id, sesiId, foto)

  await uploadFoto(path, foto)

  const { data: sesi, error } = await supabaseAdmin
    .from('sesi_mengajar')
    .insert({
      id: sesiId,
      tentor_id: profile.id,
      kelas_id: kelasId,
      mapel_id: mapelId,
      foto_path: path,
      tahun_ajaran_id: profile.tahun_ajaran_id,
      status: 'open'
    })
    .select()
    .single()

  if (error) {
    // Jangan tinggalkan file yatim di bucket kalau barisnya gagal dibuat.
    await hapusFoto(path)
    throw svelteError(400, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))
  }

  return json(sesi)
}
