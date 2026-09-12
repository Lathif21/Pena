import { createSupabaseServerClient } from '$lib/supabase/server'
import { listAnak, nilaiAnak, kehadiranAnak } from '$features/parent/data/anak.server'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const daftar = await listAnak(supabase, parentData.user.id)

  // Ringkasan per anak. Jumlah anak per wali dihitung jari, jadi query berurutan
  // di sini lebih jelas daripada satu query gabungan yang sulit dibaca.
  const anak = await Promise.all(
    daftar.map(async (a) => {
      const [nilai, kehadiran] = await Promise.all([
        nilaiAnak(supabase, a.siswaDetailId),
        kehadiranAnak(supabase, a.siswaDetailId)
      ])
      return {
        ...a,
        rataNilai: nilai.rataKeseluruhan,
        jumlahNilai: nilai.jumlah,
        hadir: kehadiran.hadir,
        totalPertemuan: kehadiran.total,
        persenHadir: kehadiran.persen
      }
    })
  )

  return { ...parentData, anak }
}
