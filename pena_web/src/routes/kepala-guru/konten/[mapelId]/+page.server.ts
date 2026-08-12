import { redirect } from '@sveltejs/kit'

/**
 * A mapel has no page of its own — its content lives under /materi. Redirect rather
 * than 404 so a bookmarked or hand-typed mapel URL still lands somewhere useful.
 */
export function load({ params }) {
  throw redirect(307, `/kepala-guru/konten/${params.mapelId}/materi`)
}
