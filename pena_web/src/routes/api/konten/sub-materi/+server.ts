import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listSubMateri,
  createSubMateri,
  updateSubMateri,
  softDeleteSubMateri,
} from '$features/module/data/sub-materi.server'

export const POST = buatEndpoint(
  {
    listSubMateri: (args) => listSubMateri(args[0] as never),
    createSubMateri: (args) => createSubMateri(args[0] as never, args[1] as never, args[2] as never),
    updateSubMateri: (args) => updateSubMateri(args[0] as never, args[1] as never, args[2] as never),
    softDeleteSubMateri: (args) => softDeleteSubMateri(args[0] as never)
  },
  ["kepala_guru"]
)
