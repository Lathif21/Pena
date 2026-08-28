<script lang="ts">
  import { resetAttempt } from '$features/question/data/attempt'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import Table from '$lib/components/Table.svelte'
  import Th from '$lib/components/Th.svelte'
  import Td from '$lib/components/Td.svelte'
  import { RotateCcw } from 'lucide-svelte'

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

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Reset Attempt Try Out</h1>
  <p class="mt-1 text-sm text-muted-foreground">Kelola dan reset attempt siswa untuk try out</p>
</div>

{#if error}
  <div class="mb-4 rounded-lg bg-red-100 p-4"><p class="text-sm text-red-800">{error}</p></div>
{/if}
{#if message}
  <div class="mb-4 rounded-lg bg-emerald-100 p-4">
    <p class="text-sm text-emerald-800">✓ {message}</p>
  </div>
{/if}

<Card class="mb-6">
  <h2 class="mb-4 font-serif text-lg text-foreground">Filter</h2>
  <div>
    <label for="tryOut" class="block text-sm font-medium text-foreground">Try Out (Opsional)</label>
    <select
      id="tryOut"
      bind:value={selectedTryOutId}
      class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
    >
      <option value="">Semua Try Out</option>
      {#each data.tryOut as t (t.id)}
        <option value={t.id}>{t.judul}</option>
      {/each}
    </select>
  </div>
</Card>

{#if getFilteredAttempts().length === 0}
  <Card class="p-8 text-center">
    <p class="text-sm text-muted-foreground">Tidak ada attempt untuk filter ini</p>
  </Card>
{:else}
  <!-- Tujuh kolom dan tombol Reset di ujung — di bawah md wajib jadi card,
       kalau tidak tombolnya terdorong keluar layar. -->
  <div class="space-y-3 md:hidden">
    {#each getFilteredAttempts() as attempt (attempt.id)}
      <Card>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-medium text-foreground">{attempt.siswa_detail.nama_lengkap}</p>
            <p class="text-sm text-muted-foreground">{getTryOutName(attempt.try_out_id)}</p>
          </div>
          <Badge tone={attempt.is_active ? 'info' : 'pending'}>
            {attempt.is_active ? 'Aktif' : 'Diganti'}
          </Badge>
        </div>
        <dl class="mt-3 space-y-1 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Nilai</dt>
            <dd class="font-mono text-foreground">{attempt.nilai ?? '—'}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Mulai</dt>
            <dd class="font-mono text-foreground">{formatDateTime(attempt.started_at)}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Selesai</dt>
            <dd class="font-mono text-foreground">
              {attempt.submitted_at ? formatDateTime(attempt.submitted_at) : 'Belum selesai'}
            </dd>
          </div>
        </dl>
        {#if attempt.is_active && attempt.submitted_at}
          <Button
            variant="secondary"
            class="mt-3 w-full"
            onclick={() => handleReset(attempt)}
            disabled={resetting === attempt.id}
          >
            <RotateCcw class="mr-2 h-4 w-4" />
            {resetting === attempt.id ? 'Memproses...' : 'Reset'}
          </Button>
        {/if}
      </Card>
    {/each}
  </div>

  <div class="hidden md:block">
    <Table>
      {#snippet head()}
        <Th>Siswa</Th>
        <Th>Try Out</Th>
        <Th>Nilai</Th>
        <Th>Mulai</Th>
        <Th>Selesai</Th>
        <Th>Status</Th>
        <Th>Aksi</Th>
      {/snippet}
      {#snippet body()}
        {#each getFilteredAttempts() as attempt (attempt.id)}
          <tr class="border-b border-border hover:bg-muted/30">
            <Td class="font-medium">{attempt.siswa_detail.nama_lengkap}</Td>
            <Td class="text-muted-foreground">{getTryOutName(attempt.try_out_id)}</Td>
            <Td numeric>
              {#if attempt.nilai !== null}
                <Badge tone="success">{attempt.nilai}</Badge>
              {:else}
                <span class="text-muted-foreground">—</span>
              {/if}
            </Td>
            <Td numeric class="text-muted-foreground">{formatDateTime(attempt.started_at)}</Td>
            <Td numeric class="text-muted-foreground">
              {#if attempt.submitted_at}
                {formatDateTime(attempt.submitted_at)}
              {:else}
                <span class="font-sans text-amber-800">Belum selesai</span>
              {/if}
            </Td>
            <Td>
              <Badge tone={attempt.is_active ? 'info' : 'pending'}>
                {attempt.is_active ? 'Aktif' : 'Diganti'}
              </Badge>
            </Td>
            <Td>
              {#if attempt.is_active && attempt.submitted_at}
                <Button
                  variant="secondary"
                  onclick={() => handleReset(attempt)}
                  disabled={resetting === attempt.id}
                >
                  <RotateCcw class="mr-2 h-4 w-4" />
                  {resetting === attempt.id ? '...' : 'Reset'}
                </Button>
              {/if}
            </Td>
          </tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{/if}

<div class="mt-6 rounded-xl border border-border bg-secondary p-4 text-sm text-secondary-foreground">
  <p class="mb-2 font-medium">Informasi reset:</p>
  <ul class="space-y-1">
    <li>• Reset hanya tersedia untuk attempt yang sudah selesai (submitted)</li>
    <li>• Attempt lama akan ditandai "Diganti" (is_active = false)</li>
    <li>• Attempt baru akan dibuat dengan nilai kosong</li>
    <li>• Siswa dapat mengerjakan ulang try out</li>
  </ul>
</div>
