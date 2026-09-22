import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listTentor,
  createTentor,
  deleteTentor,
} from '$features/account/data/tentor.server'

export const POST = buatEndpoint(
  {
    listTentor: (args) => listTentor(),
    createTentor: (args) => createTentor(args[0] as never, args[1] as never, args[2] as never, args[3] as never),
    deleteTentor: (args) => deleteTentor(args[0] as never)
  },
  ["kepala_guru"]
)
