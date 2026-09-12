import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getPengajar, mengajarKelasMapel } from '$lib/supabase/sesi.server'
import { hariIni, kirimNotifikasi } from '$features/relief/data/relief.server'

/**
 * Mengajukan relief.
 *
 * Otorisasi: pemanggil harus benar-benar mengajar kelas+mapel yang dia lepas.
 * Tanpa itu seorang tentor bisa menunjuk pengganti untuk kelas yang bukan
 * urusannya, dan baris relief adalah izin membuka sesi — jadi ini setara
 * memberikan akses ke kelas orang lain.
 */
export async function POST({ request, cookies, url }) {
  const profile = await getPengajar(cookies)

  const body = await request.json().catch(() => null)
  if (!body) throw svelteError(400, 'Body tidak valid')

  const { penggantiId, kelasId, mapelId, tanggal, task } = body

  if (typeof penggantiId !== 'string' || !penggantiId) throw svelteError(400, 'Pengganti wajib dipilih')
  if (typeof kelasId !== 'string' || !kelasId) throw svelteError(400, 'Kelas wajib dipilih')
  if (typeof mapelId !== 'string' || !mapelId) throw svelteError(400, 'Mapel wajib dipilih')
  if (typeof tanggal !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    throw svelteError(400, 'Tanggal tidak valid')
  }
  if (typeof task !== 'string' || !task.trim()) throw svelteError(400, 'Task delegasi wajib diisi')

  // Perbandingan string aman untuk format YYYY-MM-DD, dan membandingkannya ke
  // hari ini versi Asia/Jakarta — bukan tanggal server — supaya pengajuan untuk
  // hari ini tidak ditolak hanya karena server berjalan di UTC.
  if (tanggal < hariIni()) throw svelteError(400, 'Tanggal tidak boleh di masa lalu')

  if (penggantiId === profile.id) throw svelteError(400, 'Pengganti tidak boleh diri sendiri')

  if (!(await mengajarKelasMapel(profile.id, kelasId, mapelId))) {
    throw svelteError(403, 'Anda tidak mengajar kelas ini')
  }

  const { data: pengganti } = await supabaseAdmin
    .from('profiles')
    .select('id, nama_lengkap, email, role')
    .eq('id', penggantiId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!pengganti || pengganti.role !== 'tentor') {
    throw svelteError(400, 'Pengganti harus tentor aktif')
  }

  const { data: relief, error } = await supabaseAdmin
    .from('relief')
    .insert({
      tentor_asli_id: profile.id,
      pengganti_id: penggantiId,
      kelas_id: kelasId,
      mapel_id: mapelId,
      tanggal,
      task: task.trim(),
      status: 'aktif',
      tahun_ajaran_id: profile.tahun_ajaran_id
    })
    .select('*, kelas:kelas_id(nama), mapel:mapel_id(nama)')
    .single()

  if (error) {
    // Unique index parsial: satu relief aktif per tentor+kelas+mapel+tanggal.
    if (error.code === '23505') {
      throw svelteError(409, 'Sudah ada relief aktif untuk kelas, mapel, dan tanggal ini')
    }
    throw svelteError(400, error.message)
  }

  const emailError = await kirimNotifikasi('baru', relief, profile.id, pengganti, url.origin)

  return json({ relief, emailError })
}
