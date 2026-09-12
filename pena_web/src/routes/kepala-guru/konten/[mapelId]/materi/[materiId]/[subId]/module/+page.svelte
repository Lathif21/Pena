<script lang="ts">
  import {
    getModuleBySubMateri,
    uploadModule,
    publishModule,
    unpublishModule,
    type Module
  } from '$features/module/data/module'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import { FileText } from 'lucide-svelte'

  let { data } = $props()

  let modul = $state<Module | null>(null)
  let signedUrl = $state('')
  let loading = $state(true)
  let busy = $state(false)
  let error = $state('')
  let fileInput = $state<HTMLInputElement | null>(null)

  async function load() {
    loading = true
    error = ''
    try {
      // Signed URL diterbitkan server: modul tinggal di bucket privat, dan
      // halaman ini berjalan di browser tanpa hak untuk menandatanganinya.
      const res = await fetch(`/api/modul/${data.subMateri.id}`)
      if (!res.ok) throw new Error('Gagal memuat modul')
      const body = await res.json()
      modul = body.modul
      signedUrl = body.url ?? ''

      // Satu baris bisa hidup lebih lama dari filenya (pembersihan manual,
      // deploy gagal). Diperiksa, bukan dibiarkan iframe merender 404.
      if (signedUrl) {
        const head = await fetch(signedUrl, { method: 'HEAD' }).catch(() => null)
        if (!head?.ok) signedUrl = ''
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal memuat modul'
    } finally {
      loading = false
    }
  }

  async function handleFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      error = 'File harus berformat PDF'
      input.value = ''
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      error = 'Ukuran file maksimal 20MB'
      input.value = ''
      return
    }

    busy = true
    error = ''
    try {
      await uploadModule(data.subMateri.id, file)
      await load()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal mengunggah PDF'
    } finally {
      busy = false
      input.value = ''
    }
  }

  async function handlePublish() {
    if (!modul) return
    if (!confirm('Publish modul ini? Modul akan langsung terlihat oleh siswa.')) return

    busy = true
    error = ''
    try {
      await publishModule()
      await load()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal publish modul'
    } finally {
      busy = false
    }
  }

  async function handleUnpublish() {
    if (!modul) return
    if (
      !confirm(
        'Batalkan publish? Modul kembali jadi draft dan langsung hilang dari halaman siswa sampai dipublish lagi.'
      )
    )
      return

    busy = true
    error = ''
    try {
      await unpublishModule()
      await load()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal membatalkan publish'
    } finally {
      busy = false
    }
  }

  $effect(() => {
    load()
  })
</script>

<svelte:head>
  <title>{data.subMateri.nama} — Modul · Pena</title>
</svelte:head>

<div class="mb-6">
  <a
    href="/kepala-guru/konten/{data.mapel?.id}/materi/{data.materi?.id}"
    class="text-sm font-medium text-primary hover:underline"
  >
    ← Kembali ke {data.materi?.nama}
  </a>
</div>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">{data.subMateri.nama}</h1>
  <p class="mt-1 text-sm text-muted-foreground">Modul PDF untuk sub materi ini</p>
</div>

{#if error}
  <div class="mb-4 rounded-lg border border-border bg-red-100 p-4">
    <p class="text-sm font-medium text-red-800">{error}</p>
  </div>
{/if}

{#if loading}
  <p class="text-sm text-muted-foreground">Memuat...</p>
{:else}
  <Card class="mb-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm text-muted-foreground">Status</p>
        <span class="mt-1 block">
          {#if !modul}
            <span
              class="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              Belum ada modul
            </span>
          {:else if modul.status === 'published'}
            <Badge tone="success">Published</Badge>
          {:else}
            <Badge tone="pending">Draft</Badge>
          {/if}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        {#if modul?.status === 'published'}
          <p class="text-sm text-muted-foreground">
            Dipublish
            <span class="font-mono">
              {modul.published_at ? new Date(modul.published_at).toLocaleDateString('id-ID') : ''}
            </span>
          </p>
          <Button variant="secondary" onclick={handleUnpublish} disabled={busy}>
            {busy ? 'Memproses...' : 'Batalkan Publish'}
          </Button>
        {:else}
          <input
            bind:this={fileInput}
            type="file"
            accept="application/pdf"
            onchange={handleFileChange}
            class="hidden"
          />
          <Button variant="secondary" onclick={() => fileInput?.click()} disabled={busy}>
            {busy ? 'Memproses...' : modul ? 'Ganti PDF' : 'Upload PDF'}
          </Button>
          {#if modul}
            <Button onclick={handlePublish} disabled={busy}>Publish</Button>
          {/if}
        {/if}
      </div>
    </div>
  </Card>

  {#if signedUrl}
    <Card class="p-4">
      <h2 class="mb-3 font-serif text-base text-foreground">Pratinjau PDF</h2>
      <iframe
        src={signedUrl}
        title="Pratinjau modul"
        class="h-[70vh] w-full rounded-lg border border-border"
      ></iframe>
    </Card>
  {:else if !modul}
    <div class="rounded-xl border border-dashed border-border p-8 text-center">
      <FileText class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-2 text-sm text-muted-foreground">Belum ada PDF. Upload file untuk mulai.</p>
    </div>
  {:else}
    <div class="rounded-xl border border-dashed border-border bg-amber-100 p-8 text-center">
      <p class="text-sm font-medium text-amber-800">File PDF tidak ditemukan di storage</p>
      <p class="mt-1 text-xs text-amber-800">
        Data modul ada, tapi filenya hilang. Upload ulang PDF untuk sub materi ini.
      </p>
    </div>
  {/if}
{/if}
