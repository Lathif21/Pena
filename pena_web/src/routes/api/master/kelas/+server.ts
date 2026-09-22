import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listKelas,
  createKelas,
  updateKelas,
  deleteKelas,
} from '$features/master-data/data/kelas.server'

export const POST = buatEndpoint(
  {
    listKelas: (args) => listKelas(),
    createKelas: (args) => createKelas(args[0] as never),
    updateKelas: (args) => updateKelas(args[0] as never, args[1] as never),
    deleteKelas: (args) => deleteKelas(args[0] as never)
  },
  ["kepala_guru"]
)
