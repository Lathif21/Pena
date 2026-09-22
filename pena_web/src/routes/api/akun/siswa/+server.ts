import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listSiswa,
  createSiswa,
  deleteSiswa,
} from '$features/account/data/siswa.server'

export const POST = buatEndpoint(
  {
    listSiswa: (args) => listSiswa(),
    createSiswa: (args) => createSiswa(args[0] as never, args[1] as never, args[2] as never, args[3] as never, args[4] as never, args[5] as never, args[6] as never),
    deleteSiswa: (args) => deleteSiswa(args[0] as never)
  },
  ["kepala_guru"]
)
