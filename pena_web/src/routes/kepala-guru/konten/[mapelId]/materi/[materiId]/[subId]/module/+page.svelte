<script lang="ts">
  import {
    getModuleBySubMateri,
    uploadModule,
    publishModule,
    unpublishModule,
    getModuleUrl,
    type Module
  } from '$features/module/data/module'

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
      modul = await getModuleBySubMateri(data.subMateri.id)
      signedUrl = modul?.storage_path ? getModuleUrl(modul.storage_path) : ''

      // A row can outlive its file (manual cleanup, failed deploy). Check rather than
      // letting the iframe render a raw 404.
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

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-6">
      <a
        href="/kepala-guru/konten/{data.mapel?.id}/materi/{data.materi?.id}"
        class="text-sm font-medium text-primary hover:underline"
      >
        ← Kembali ke {data.materi?.nama}
      </a>
    </div>

    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{data.subMateri.nama}</h1>
      <p class="mt-1 text-sm text-gray-500">Modul PDF untuk sub materi ini</p>
    </div>

    {#if error}
      <div class="mb-4 rounded-md bg-red-50 p-4">
        <p class="text-sm font-medium text-red-800">{error}</p>
      </div>
    {/if}

    {#if loading}
      <p class="text-sm text-gray-500">Loading...</p>
    {:else}
      <div class="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-sm text-gray-500">Status</p>
            {#if !modul}
              <span class="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                Belum ada modul
              </span>
            {:else if modul.status === 'published'}
              <span class="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Published
              </span>
            {:else}
              <span class="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Draft
              </span>
            {/if}
          </div>

          <div class="flex items-center gap-3">
            {#if modul?.status === 'published'}
              <p class="text-sm text-gray-500">
                Dipublish
                {modul.published_at ? new Date(modul.published_at).toLocaleDateString('id-ID') : ''}
              </p>
              <button
                onclick={handleUnpublish}
                disabled={busy}
                class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {busy ? 'Memproses...' : 'Batalkan Publish'}
              </button>
            {:else}
              <input
                bind:this={fileInput}
                type="file"
                accept="application/pdf"
                onchange={handleFileChange}
                class="hidden"
              />
              <button
                onclick={() => fileInput?.click()}
                disabled={busy}
                class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {busy ? 'Memproses...' : modul ? 'Ganti PDF' : 'Upload PDF'}
              </button>
              {#if modul}
                <button
                  onclick={handlePublish}
                  disabled={busy}
                  class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  Publish
                </button>
              {/if}
            {/if}
          </div>
        </div>
      </div>

      {#if signedUrl}
        <div class="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 class="mb-3 text-sm font-semibold text-gray-900">Pratinjau PDF</h2>
          <iframe src={signedUrl} title="Pratinjau modul" class="h-[70vh] w-full rounded-lg border border-gray-100"></iframe>
        </div>
      {:else if !modul}
        <div class="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
          <p class="text-sm text-gray-500">Belum ada PDF. Upload file untuk mulai.</p>
        </div>
      {:else}
        <div class="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center">
          <p class="text-sm font-medium text-amber-800">File PDF tidak ditemukan di storage</p>
          <p class="mt-1 text-xs text-amber-700">
            Data modul ada, tapi filenya hilang. Upload ulang PDF untuk sub materi ini.
          </p>
        </div>
      {/if}
    {/if}
  </div>
</div>
