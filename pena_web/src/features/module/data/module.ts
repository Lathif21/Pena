import { panggil } from '$lib/api/panggil'
import { deserialize } from '$app/forms'

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

export async function getModuleBySubMateri(subMateriId: string): Promise<Module | null> {
  return panggil<Module | null>('/api/konten/module', 'getModuleBySubMateri', subMateriId)
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

/**
 * Publish state changes go through the page's form actions, which re-check the
 * kepala_guru role server-side. Doing it from the browser would be unauthorized —
 * there is no RLS on `module`.
 */
async function callAction(action: 'publish' | 'unpublish') {
  const res = await fetch(`?/${action}`, {
    method: 'POST',
    headers: { 'x-sveltekit-action': 'true' },
    body: new FormData()
  })

  const result = deserialize(await res.text())
  if (result.type === 'failure') {
    throw new Error((result.data?.error as string) ?? 'Gagal mengubah status modul')
  }
  if (result.type === 'error') throw new Error(result.error.message)
}

export function publishModule() {
  return callAction('publish')
}

export function unpublishModule() {
  return callAction('unpublish')
}
