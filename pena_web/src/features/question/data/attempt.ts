export interface Attempt {
  id: string
  siswa_detail_id: string
  try_out_id: string | null
  sub_materi_id: string | null
  started_at: string
  submitted_at: string | null
  nilai: number | null
  is_active: boolean
}

/**
 * Every mutation goes through /api/attempt. Nothing here writes to Supabase directly:
 * the timer, the single-attempt rule, and the scoring are all server-authoritative,
 * because a browser that can write its own nilai can write a 100.
 */
async function call<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) }
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal memproses attempt')
  }

  return res.json() as Promise<T>
}

export function startTryOut(tryOutId: string) {
  return call<Attempt>('/api/attempt', { method: 'POST', body: JSON.stringify({ tryOutId }) })
}

export function startLatihan(subMateriId: string) {
  return call<Attempt>('/api/attempt', { method: 'POST', body: JSON.stringify({ subMateriId }) })
}

export function saveJawaban(attemptId: string, soalId: string, pilihanId: string | null) {
  return call<{ saved: true }>(`/api/attempt/${attemptId}`, {
    method: 'PATCH',
    body: JSON.stringify({ soalId, pilihanId })
  })
}

export async function submitAttempt(attemptId: string) {
  const { nilai } = await call<{ nilai: number }>(`/api/attempt/${attemptId}`, { method: 'POST' })
  return nilai
}

/** Kepala guru only — enforced server-side, not by hiding the button. */
export function resetAttempt(attemptId: string) {
  return call<Attempt>(`/api/attempt/${attemptId}/reset`, { method: 'POST' })
}
