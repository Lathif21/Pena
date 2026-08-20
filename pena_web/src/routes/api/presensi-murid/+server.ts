import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { sesiMilikPemanggil } from '$lib/supabase/sesi.server'

/**
 * Menyimpan presensi murid. Bisa dipanggil berkali-kali selagi sesi `open` —
 * tentor boleh mengoreksi centang sampai sesi ditutup.
 *
 * Ditolak kalau sesi tidak ada, bukan milik pemanggil, atau sudah `closed`.
 */
export async function POST({ request, cookies }) {
  const { sesiId, entries } = await request.json().catch(() => ({}))

  if (!sesiId) throw svelteError(400, 'sesiId wajib diisi')
  if (!Array.isArray(entries) || entries.length === 0) {
    throw svelteError(400, 'Tidak ada data presensi untuk disimpan')
  }

  const { sesi } = await sesiMilikPemanggil(cookies, sesiId, { harusOpen: true })

  // Hanya siswa yang benar-benar terdaftar di kelas sesi ini. Tanpa ini, klien
  // bisa menitipkan siswa_detail_id mana pun dan mengarang riwayat kehadiran.
  const { data: anggota } = await supabaseAdmin
    .from('siswa_kelas')
    .select('siswa_detail_id')
    .eq('kelas_id', sesi.kelas_id)
    .is('deleted_at', null)

  const sah = new Set((anggota ?? []).map((a) => a.siswa_detail_id))

  const baris = []
  for (const e of entries) {
    if (typeof e?.siswaDetailId !== 'string' || typeof e?.isHadir !== 'boolean') {
      throw svelteError(400, 'Format presensi tidak valid')
    }
    if (!sah.has(e.siswaDetailId)) {
      throw svelteError(400, 'Ada siswa yang bukan anggota kelas sesi ini')
    }
    baris.push({
      sesi_id: sesi.id,
      siswa_detail_id: e.siswaDetailId,
      is_hadir: e.isHadir,
      tahun_ajaran_id: sesi.tahun_ajaran_id
    })
  }

  const { error } = await supabaseAdmin
    .from('presensi_murid')
    .upsert(baris, { onConflict: 'sesi_id,siswa_detail_id' })

  if (error) throw svelteError(400, error.message)

  return json({ saved: baris.length })
}
