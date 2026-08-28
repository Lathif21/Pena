/**
 * Menutup sesi. Selalu lewat endpoint, yang meneruskan ke RPC `close_sesi` —
 * tiga efeknya (sesi closed, presensi terkunci, jurnal submitted) harus terjadi
 * dalam satu transaksi, bukan tiga panggilan berurutan dari browser.
 */
export async function closeSesi(sesiId: string) {
  const res = await fetch(`/api/sesi/${sesiId}/close`, { method: 'POST' })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal menyelesaikan sesi')
  }

  return res.json() as Promise<{ closed: true }>
}
