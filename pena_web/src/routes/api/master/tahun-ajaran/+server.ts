import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listTahunAjaran,
  createTahunAjaran,
  setActiveTahunAjaran,
  deleteTahunAjaran,
} from '$features/master-data/data/tahun-ajaran.server'

export const POST = buatEndpoint(
  {
    listTahunAjaran: (args) => listTahunAjaran(),
    createTahunAjaran: (args) => createTahunAjaran(args[0] as never),
    setActiveTahunAjaran: (args) => setActiveTahunAjaran(args[0] as never),
    deleteTahunAjaran: (args) => deleteTahunAjaran(args[0] as never)
  },
  ["kepala_guru"]
)
