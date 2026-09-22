import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listMapel,
  createMapel,
  updateMapel,
  deleteMapel,
  listKelasForMapel,
  setMapelKelas,
  listMapelForKelas,
} from '$features/master-data/data/mapel.server'

export const POST = buatEndpoint(
  {
    listMapel: (args) => listMapel(),
    createMapel: (args) => createMapel(args[0] as never, args[1] as never),
    updateMapel: (args) => updateMapel(args[0] as never, args[1] as never, args[2] as never),
    deleteMapel: (args) => deleteMapel(args[0] as never),
    listKelasForMapel: (args) => listKelasForMapel(args[0] as never),
    setMapelKelas: (args) => setMapelKelas(args[0] as never, args[1] as never),
    listMapelForKelas: (args) => listMapelForKelas(args[0] as never)
  },
  ["kepala_guru"]
)
