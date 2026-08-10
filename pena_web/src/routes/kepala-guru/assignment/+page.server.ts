import { error as svelteError, fail } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { isKepalaGuru } from '$lib/supabase/guard.server'

export async function load({ cookies, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: tahunAjaran, error } = await supabase
    .from('tahun_ajaran')
    .select('id, nama, is_active')
    .is('deleted_at', null)
    .order('nama', { ascending: false })

  if (error) throw svelteError(500, error.message)

  const list = tahunAjaran ?? []
  const active = list.find(t => t.is_active) ?? list[0] ?? null

  return { ...parentData, tahunAjaran: list, activeTahunAjaranId: active?.id ?? '' }
}

function readAssignmentFields(form: FormData) {
  const fields = {
    tentor_id: String(form.get('tentor_id') ?? ''),
    kelas_id: String(form.get('kelas_id') ?? ''),
    mapel_id: String(form.get('mapel_id') ?? ''),
    tahun_ajaran_id: String(form.get('tahun_ajaran_id') ?? '')
  }

  for (const [name, value] of Object.entries(fields)) {
    if (!value) return { error: `${name.replace('_id', '')} wajib dipilih` as const }
  }

  return fields
}

export const actions = {
  create: async ({ request, cookies }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const fields = readAssignmentFields(form)
    if ('error' in fields) return fail(400, { error: fields.error })

    const supabase = createSupabaseServerClient(cookies)
    const { error } = await supabase.from('tentor_kelas_mapel').insert(fields)

    if (error) {
      // The table has a unique constraint on the whole tuple.
      const message = error.code === '23505' ? 'Assignment ini sudah ada' : error.message
      return fail(400, { error: message })
    }

    return { success: true }
  },

  update: async ({ request, cookies }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const assignmentId = String(form.get('assignment_id') ?? '')
    if (!assignmentId) return fail(400, { error: 'Assignment tidak ditemukan' })

    const fields = readAssignmentFields(form)
    if ('error' in fields) return fail(400, { error: fields.error })

    const supabase = createSupabaseServerClient(cookies)
    const { error } = await supabase
      .from('tentor_kelas_mapel')
      .update(fields)
      .eq('id', assignmentId)
      .is('deleted_at', null)

    if (error) {
      const message = error.code === '23505' ? 'Assignment ini sudah ada' : error.message
      return fail(400, { error: message })
    }

    return { success: true }
  }
}
