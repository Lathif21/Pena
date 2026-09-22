import { buatEndpoint } from '$lib/api/rpc.server'
import {
  getTryOut,
  getTryOutKelas,
} from '$features/question/data/try-out.server'

export const POST = buatEndpoint(
  {
    getTryOut: (args) => getTryOut(args[0] as never),
    getTryOutKelas: (args) => getTryOutKelas(args[0] as never)
  },
  ["kepala_guru"]
)
