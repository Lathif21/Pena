import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listKelasByTentor,
  listMapelByKelas,
  getSesiAktif,
} from '$features/attendance/data/sesi.server'

export const POST = buatEndpoint(
  {
    listKelasByTentor: (args) => listKelasByTentor(args[0] as never),
    listMapelByKelas: (args) => listMapelByKelas(args[0] as never, args[1] as never),
    getSesiAktif: (args) => getSesiAktif(args[0] as never)
  },
  ["tentor", "kepala_guru"]
)
