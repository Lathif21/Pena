import { buatEndpoint } from '$lib/api/rpc.server'
import {
  getModuleBySubMateri,
} from '$features/module/data/module.server'

export const POST = buatEndpoint(
  {
    getModuleBySubMateri: (args) => getModuleBySubMateri(args[0] as never)
  },
  ["kepala_guru"]
)
