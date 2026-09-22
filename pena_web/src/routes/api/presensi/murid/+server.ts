import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listSiswaByKelas,
  getPresensiBySesi,
} from '$features/attendance/data/presensi-murid.server'

export const POST = buatEndpoint(
  {
    listSiswaByKelas: (args) => listSiswaByKelas(args[0] as never),
    getPresensiBySesi: (args) => getPresensiBySesi(args[0] as never)
  },
  ["tentor", "kepala_guru"]
)
