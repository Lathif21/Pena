import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { sesiMilikPemanggil } from '$lib/supabase/sesi.server'

/**
 * Selesai Mengajar. Kepemilikan diperiksa di sini; prasyarat jurnal dan
 * status sesi diperiksa di dalam RPC, supaya keduanya berada di transaksi yang
 * sama dengan perubahannya.
 */
export async function POST({ cookies, params }) {
  // Sengaja tanpa harusOpen: sesi yang sudah closed ditolak oleh RPC dengan
  // pesannya sendiri, jadi klik kedua tetap dapat alasan yang benar.
  await sesiMilikPemanggil(cookies, params.id)

  const { error } = await supabaseAdmin.rpc('close_sesi', { p_sesi_id: params.id })

  if (error) {
    // Exception dari plpgsql sampai ke sini sebagai teks. Diterjemahkan ke status
    // yang tepat supaya UI bisa membedakan "belum siap" dari "sudah selesai".
    const pesan = error.message ?? 'Gagal menyelesaikan sesi'

    if (pesan.includes('Jurnal mengajar belum diisi')) {
      throw svelteError(400, 'Jurnal mengajar belum diisi')
    }
    if (pesan.includes('Sesi sudah ditutup')) {
      throw svelteError(409, 'Sesi sudah ditutup')
    }
    if (pesan.includes('Sesi tidak ditemukan')) {
      throw svelteError(404, 'Sesi tidak ditemukan')
    }

    throw svelteError(400, pesan)
  }

  return json({ closed: true })
}
