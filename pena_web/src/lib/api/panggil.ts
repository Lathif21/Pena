/**
 * Memanggil satu aksi di endpoint fitur. Pengganti panggilan langsung ke
 * Supabase dari browser — bentuk fungsi di modul data tetap sama, hanya
 * jalurnya yang sekarang lewat server.
 */
export async function panggil<T>(jalur: string, aksi: string, ...args: unknown[]): Promise<T> {
  const res = await fetch(jalur, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ aksi, args })
  })

  if (!res.ok) {
    const { message } = await res.json().catch(() => ({ message: '' }))
    throw new Error(message || `Gagal memanggil ${aksi}`)
  }

  return (await res.json()).data as T
}
