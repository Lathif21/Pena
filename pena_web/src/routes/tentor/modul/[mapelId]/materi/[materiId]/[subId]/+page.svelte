<script lang="ts">
  let { data } = $props()

  let fullscreen = $state(false)
</script>

<div class="mx-auto max-w-5xl">
  <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <a href="/tentor/modul" class="text-sm font-medium text-primary hover:underline">
        ← Kembali ke Modul
      </a>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">{data.subMateri.nama}</h1>
    </div>

    <button
      onclick={() => (fullscreen = !fullscreen)}
      class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {fullscreen ? 'Perkecil' : 'Layar Penuh'}
    </button>
  </div>

  {#if data.signedUrl}
    <div class="rounded-2xl border border-gray-200 bg-white p-4">
      <iframe
        src={data.signedUrl}
        title={data.subMateri.nama}
        class="w-full rounded-lg border border-gray-100 {fullscreen ? 'h-[90vh]' : 'h-[70vh]'}"
      ></iframe>
    </div>
  {:else}
    <div class="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
      <p class="text-sm text-gray-500">Modul tidak dapat dimuat.</p>
    </div>
  {/if}
</div>
