<script lang="ts">
  import Badge from '$lib/components/Badge.svelte'
  import Card from '$lib/components/Card.svelte'
  import { FileText, ClipboardList, Lock, Clock, BookOpen } from 'lucide-svelte'

  let { data } = $props()

  let searchTerm = $state('')

  // ponytail: pencarian di klien. Satu mapel punya puluhan materi, bukan ribuan.
  let filteredMateri = $derived.by(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return data.materi

    return data.materi
      .map(m => {
        const matchMateri = m.nama.toLowerCase().includes(term)
        const subMatch = m.sub_materi.filter(s => s.nama.toLowerCase().includes(term))
        const tryOutMatch = m.try_out.filter(t => t.judul.toLowerCase().includes(term))
        if (matchMateri) return m
        if (subMatch.length > 0 || tryOutMatch.length > 0) {
          return { ...m, sub_materi: subMatch, try_out: tryOutMatch }
        }
        return null
      })
      .filter(Boolean)
  })
</script>

<svelte:head>
  <title>{data.mapel.nama} · Pena</title>
</svelte:head>

<div class="mb-6">
  <a href="/siswa/mapel" class="text-sm font-medium text-primary hover:underline">
    ← Kembali ke Mata Pelajaran
  </a>
  <h1 class="mt-4 font-serif text-2xl text-foreground">{data.mapel.nama}</h1>
  <p class="mt-1 text-sm text-muted-foreground">Pilih materi untuk membaca modul</p>
</div>

<input
  type="search"
  placeholder="Cari materi atau sub materi..."
  bind:value={searchTerm}
  class="mb-6 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
/>

{#if data.materi.length === 0}
  <div class="rounded-xl border border-dashed border-border p-8 text-center">
    <BookOpen class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">
      Belum ada materi yang tersedia untuk mata pelajaran ini.
    </p>
  </div>
{:else if filteredMateri.length === 0}
  <Card class="p-8 text-center">
    <BookOpen class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">Tidak ada hasil untuk "{searchTerm}"</p>
  </Card>
{:else}
  <div class="space-y-4">
    {#each filteredMateri as materi (materi.id)}
      <Card>
        <h2 class="font-serif text-base text-foreground">
          <span class="font-mono">{materi.nomor_urut}.</span>
          {materi.nama}
        </h2>

        <div class="mt-4 space-y-2">
          {#each materi.sub_materi as sub (sub.id)}
            <a
              href="/siswa/mapel/{data.mapel.id}/materi/{materi.id}/{sub.id}"
              class="flex items-center gap-2 rounded-lg bg-muted/30 px-4 py-3 text-sm text-foreground hover:bg-muted/50"
            >
              <FileText class="h-4 w-4 shrink-0 text-muted-foreground" />
              {sub.nama}
            </a>
          {/each}
        </div>

        {#if materi.try_out.length > 0}
          <div class="mt-4 space-y-2 border-t border-border pt-4">
            {#each materi.try_out as to (to.id)}
              {@const label =
                to.status === 'selesai'
                  ? `Selesai · Nilai ${to.nilai}`
                  : to.status === 'terbuka'
                    ? `${to.durasi_menit} menit · sekali kerjakan`
                    : to.status === 'belum_buka'
                      ? `Dibuka ${new Date(to.waktu_buka).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`
                      : 'Tidak dikerjakan · Nilai 0'}
              {#if to.dapatDibuka}
                <a
                  href="/siswa/mapel/{data.mapel.id}/materi/{materi.id}/try-out/{to.id}"
                  class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm hover:bg-muted/40"
                >
                  <span class="flex items-center gap-2 font-medium text-primary">
                    <ClipboardList class="h-4 w-4 shrink-0" />
                    {to.judul}
                  </span>
                  <Badge tone={to.status === 'selesai' ? 'success' : 'pending'}>{label}</Badge>
                </a>
              {:else}
                <!-- Belum dibuka / terlewat: terlihat tapi tidak bisa dibuka, dan
                     soalnya memang tidak pernah ikut dikirim ke browser. -->
                <div
                  class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
                >
                  <span class="flex items-center gap-2 font-medium text-muted-foreground">
                    {#if to.status === 'belum_buka'}
                      <Lock class="h-4 w-4 shrink-0" />
                    {:else}
                      <Clock class="h-4 w-4 shrink-0" />
                    {/if}
                    {to.judul}
                  </span>
                  {#if to.status === 'terlewat'}
                    <Badge tone="error">{label}</Badge>
                  {:else}
                    <span
                      class="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </span>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </Card>
    {/each}
  </div>
{/if}
