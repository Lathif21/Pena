import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listNilaiManual,
} from '$features/grading/data/nilai-manual.server'

export const POST = buatEndpoint(
  {
    listNilaiManual: (args) => listNilaiManual(args[0] as never, args[1] as never)
  },
  ["tentor", "kepala_guru"]
)
