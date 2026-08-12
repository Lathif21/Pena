<script lang="ts">
  import { resetAttempt } from '$features/question/data/attempt'

  let { data } = $props()

  let selectedTryOutId = $state('')
  let resetting = $state<string | null>(null)
  let error = $state('')
  let message = $state('')

  function getFilteredAttempts() {
    if (!selectedTryOutId) return data.attempt
    return data.attempt.filter(a => a.try_out_id === selectedTryOutId)
  }

  function getTryOutName(tryOutId: string) {
    return data.tryOut.find(t => t.id === tryOutId)?.judul || 'Unknown'
  }

  async function handleReset(attempt: any) {
    const tryOutName = getTryOutName(attempt.try_out_id)
    if (!confirm(`Reset attempt "${attempt.siswa_detail.nama_lengkap}" untuk "${tryOutName}"?`)) return

    resetting = attempt.id; error = ''; message = ''
    try {
      await resetAttempt(attempt.id)
      message = `Reset berhasil untuk ${attempt.siswa_detail.nama_lengkap}`
      setTimeout(() => { window.location.reload() }, 1500)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal reset attempt'
    } finally {
      resetting = null
    }
  }

  function formatDateTime(dt: string) {
    return new Date(dt).toLocaleString('id-ID')
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Reset Attempt Try Out</h1>
      <p class="mt-1 text-sm text-gray-600">Kelola dan reset attempt siswa untuk try out</p>
    </div>

    {#if error}
      <div class="mb-4 rounded-md bg-red-50 p-4"><p class="text-sm text-red-800">{error}</p></div>
    {/if}
    {#if message}
      <div class="mb-4 rounded-md bg-emerald-50 p-4"><p class="text-sm text-emerald-800">✓ {message}</p></div>
    {/if}

    <div class="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Filter</h2>
      <div>
        <label for="tryOut" class="block text-sm font-medium text-gray-700">Try Out (Opsional)</label>
        <select id="tryOut" bind:value={selectedTryOutId} class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2">
          <option value="">Semua Try Out</option>
          {#each data.tryOut as t (t.id)}
            <option value={t.id}>{t.judul}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {#if getFilteredAttempts().length === 0}
        <div class="p-8 text-center"><p class="text-gray-600">Tidak ada attempt untuk filter ini</p></div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50">
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Siswa</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Try Out</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">Nilai</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mulai</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Selesai</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#each getFilteredAttempts() as attempt (attempt.id)}
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{attempt.siswa_detail.nama_lengkap}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{getTryOutName(attempt.try_out_id)}</td>
                  <td class="px-6 py-4 text-center">
                    {#if attempt.nilai !== null}
                      <span class="inline-flex items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">{attempt.nilai}</span>
                    {:else}
                      <span class="text-gray-400">—</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">{formatDateTime(attempt.started_at)}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">
                    {#if attempt.submitted_at}
                      {formatDateTime(attempt.submitted_at)}
                    {:else}
                      <span class="text-amber-600 font-medium">Belum selesai</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-sm">
                    {#if attempt.is_active}
                      <span class="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Aktif</span>
                    {:else}
                      <span class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Diganti</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-center">
                    {#if attempt.is_active && attempt.submitted_at}
                      <button onclick={() => handleReset(attempt)} disabled={resetting === attempt.id} class="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                        {resetting === attempt.id ? '...' : '↻ Reset'}
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <div class="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
      <p class="font-medium mb-2">ℹ️ Informasi Reset:</p>
      <ul class="space-y-1">
        <li>• Reset hanya tersedia untuk attempt yang sudah selesai (submitted)</li>
        <li>• Attempt lama akan ditandai "Diganti" (is_active = false)</li>
        <li>• Attempt baru akan dibuat dengan nilai kosong</li>
        <li>• Siswa dapat mengerjakan ulang try out</li>
      </ul>
    </div>
  </div>
</div>
