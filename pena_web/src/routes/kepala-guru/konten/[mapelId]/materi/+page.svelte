<script lang="ts">
  import MateriFull from '$features/module/components/MateriFull.svelte'

  let { data } = $props()
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-6">
      <a href="/kepala-guru/konten" class="text-sm font-medium text-primary hover:underline">
        ← Kembali ke Kelola Konten
      </a>
    </div>

    <MateriFull
      mapelId={data.mapel.id}
      mapelNama={data.mapel.nama}
    />

    <div class="mt-6 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
      Try out dijadwalkan per materi — buka materi, lalu pilih <strong>Kelola Try Out</strong>.
    </div>
  </div>
</div>
