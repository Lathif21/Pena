import { buatEndpoint } from '$lib/api/rpc.server'
import {
  listTentorAssignments,
  createTentorAssignment,
  deleteTentorAssignment,
} from '$features/assignment/data/tentor-assignment.server'

export const POST = buatEndpoint(
  {
    listTentorAssignments: (args) => listTentorAssignments(args[0] as never),
    createTentorAssignment: (args) => createTentorAssignment(args[0] as never, args[1] as never, args[2] as never, args[3] as never),
    deleteTentorAssignment: (args) => deleteTentorAssignment(args[0] as never)
  },
  ["kepala_guru"]
)
