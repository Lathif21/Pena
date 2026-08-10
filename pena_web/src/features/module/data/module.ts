import { supabase } from '$lib/supabase/client'

export interface Module {
  id: string
  sub_materi_id: string
  status: 'draft' | 'published'
  /** Path relative to static/, e.g. "uploads/pdfs/<subId>-<ts>.pdf" */
  storage_path: string
  published_at: string | null
  created_at: string
  deleted_at: string | null
}

export async function getModuleBySubMateri(subMateriId: string) {
  const { data, error } = await supabase
    .from('module')
    .select('id, sub_materi_id, status, storage_path, published_at, created_at, deleted_at')
    .eq('sub_materi_id', subMateriId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return data as Module | null
}

/**
 * PDFs live on the server filesystem under static/, which SvelteKit serves at the
 * web root — so the public URL is just the stored path. No signing, no bucket.
 */
export function getModuleUrl(storagePath: string) {
  return `/${storagePath.replace(/^\/+/, '')}`
}

/** Uploads via the server endpoint, which writes the file into static/uploads/pdfs. */
export async function uploadModule(subMateriId: string, file: File) {
  const body = new FormData()
  body.append('file', file)

  const res = await fetch(`/api/modul/${subMateriId}`, { method: 'POST', body })
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({ message: 'Gagal mengunggah PDF' }))
    throw new Error(message ?? 'Gagal mengunggah PDF')
  }

  return (await res.json()) as Module
}

export async function publishModule(id: string) {
  const { data: current, error: fetchError } = await supabase
    .from('module')
    .select('status, published_at')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError
  if (current?.status === 'published') throw new Error('Module sudah dipublish')

  const { data, error } = await supabase
    .from('module')
    .update({
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Module
}
