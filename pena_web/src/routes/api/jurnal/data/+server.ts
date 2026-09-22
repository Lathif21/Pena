import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listMateriByMapel,
  getJurnalBySesi,
} from '$features/journal/data/jurnal.server'

export const POST = buatEndpoint(
  {
    listMateriByMapel: (args) => listMateriByMapel(args[0] as never),
    getJurnalBySesi: (args) => getJurnalBySesi(args[0] as never)
  },
  ["tentor", "kepala_guru"]
)
