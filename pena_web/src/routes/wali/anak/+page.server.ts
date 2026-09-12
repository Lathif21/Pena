import { createSupabaseServerClient } from '$lib/supabase/server'
import { listAnak, pilihAnak, kehadiranAnak } from '$features/parent/data/anak.server'

export async function load({ cookies, parent, url }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  // Sama seperti di /wali/progress: id dari query string hanya dipakai kalau
  // cocok dengan salah satu anak milik wali ini.
  const daftar = await listAnak(supabase, parentData.user.id)
  const terpilih = pilihAnak(daftar, url.searchParams.get('anak'))

  const kehadiran = terpilih
    ? await kehadiranAnak(supabase, terpilih.siswaDetailId)
    : { total: 0, hadir: 0, persen: null, baris: [] }

  return { ...parentData, daftar, terpilih, kehadiran }
}
