import { createSupabaseServerClient } from '$lib/supabase/server'
import { listAnak, pilihAnak, nilaiAnak } from '$features/parent/data/anak.server'

export async function load({ cookies, parent, url }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  // Id anak datang dari query string, jadi tidak boleh dipercaya: yang dipakai
  // hanya yang lolos dari daftar milik wali ini.
  const daftar = await listAnak(supabase, parentData.user.id)
  const terpilih = pilihAnak(daftar, url.searchParams.get('anak'))

  const nilai = terpilih
    ? await nilaiAnak(supabase, terpilih.siswaDetailId)
    : { perMapel: [], rataKeseluruhan: null, jumlah: 0 }

  return { ...parentData, daftar, terpilih, nilai }
}
