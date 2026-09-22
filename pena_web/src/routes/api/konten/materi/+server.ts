import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listMateri,
  createMateri,
  updateMateri,
  softDeleteMateri,
} from '$features/module/data/materi.server'

export const POST = buatEndpoint(
  {
    listMateri: (args) => listMateri(args[0] as never),
    createMateri: (args) => createMateri(args[0] as never, args[1] as never, args[2] as never),
    updateMateri: (args) => updateMateri(args[0] as never, args[1] as never, args[2] as never),
    softDeleteMateri: (args) => softDeleteMateri(args[0] as never)
  },
  ["kepala_guru"]
)
