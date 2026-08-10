import { json, error as svelteError } from '@sveltejs/kit'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { createSupabaseServerClient } from '$lib/supabase/server'

// ponytail: PDFs are written into static/ and served by SvelteKit at the web root.
// That works under `vite dev` and adapter-node running from the project root. If this
// ever moves to a build where static/ is copied at build time, uploads must move to a
// directory served explicitly (or back to object storage).
const STATIC_DIR = 'static'
const REL_DIR = 'uploads/pdfs'
const MAX_BYTES = 20 * 1024 * 1024
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST({ request, cookies, params }) {
  // subId lands in the filename, so it must be a uuid — never a client-controlled path.
  if (!UUID.test(params.subId)) throw svelteError(400, 'Sub materi tidak valid')

  const supabase = createSupabaseServerClient(cookies)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw svelteError(401, 'Belum login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (profile?.role !== 'kepala_guru') {
    throw svelteError(403, 'Hanya kepala guru yang bisa mengunggah modul')
  }

  const { data: subMateri } = await supabase
    .from('sub_materi')
    .select('id')
    .eq('id', params.subId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!subMateri) throw svelteError(404, 'Sub materi tidak ditemukan')

  const { data: existing } = await supabase
    .from('module')
    .select('id, status, storage_path')
    .eq('sub_materi_id', params.subId)
    .is('deleted_at', null)
    .maybeSingle()

  // Published content is locked — reject before writing anything to disk.
  if (existing?.status === 'published') {
    throw svelteError(409, 'Tidak bisa ganti PDF yang sudah dipublish')
  }

  const form = await request.formData()
  const file = form.get('file')

  if (!(file instanceof File)) throw svelteError(400, 'File tidak ditemukan')
  if (file.type !== 'application/pdf') throw svelteError(400, 'File harus berformat PDF')
  if (file.size === 0) throw svelteError(400, 'File kosong')
  if (file.size > MAX_BYTES) throw svelteError(400, 'Ukuran file maksimal 20MB')

  const relPath = `${REL_DIR}/${params.subId}-${Date.now()}.pdf`

  await mkdir(join(STATIC_DIR, REL_DIR), { recursive: true })
  await writeFile(join(STATIC_DIR, relPath), Buffer.from(await file.arrayBuffer()))

  const { data: saved, error: dbError } = existing
    ? await supabase
        .from('module')
        .update({ storage_path: relPath, status: 'draft' })
        .eq('id', existing.id)
        .select()
        .single()
    : await supabase
        .from('module')
        .insert({ sub_materi_id: params.subId, storage_path: relPath, status: 'draft' })
        .select()
        .single()

  if (dbError) {
    // Row never landed — drop the file so it does not linger unreferenced.
    await unlink(join(STATIC_DIR, relPath)).catch(() => {})
    throw svelteError(500, dbError.message)
  }

  // Old file is only removed once the row points at the new one.
  if (existing?.storage_path && existing.storage_path !== relPath) {
    await unlink(join(STATIC_DIR, existing.storage_path)).catch(() => {})
  }

  return json(saved)
}
