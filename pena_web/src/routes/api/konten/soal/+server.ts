import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listSoalBySubMateri,
  listSoalByTryOut,
} from '$features/question/data/soal.server'

export const POST = buatEndpoint(
  {
    listSoalBySubMateri: (args) => listSoalBySubMateri(args[0] as never),
    listSoalByTryOut: (args) => listSoalByTryOut(args[0] as never)
  },
  ["kepala_guru"]
)
