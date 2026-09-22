import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listWali,
  createWali,
  deleteWali,
  listSiswaIdsForWali,
} from '$features/account/data/wali.server'

export const POST = buatEndpoint(
  {
    listWali: (args) => listWali(),
    createWali: (args) => createWali(args[0] as never, args[1] as never, args[2] as never, args[3] as never, args[4] as never),
    deleteWali: (args) => deleteWali(args[0] as never),
    listSiswaIdsForWali: (args) => listSiswaIdsForWali(args[0] as never)
  },
  ["kepala_guru"]
)
