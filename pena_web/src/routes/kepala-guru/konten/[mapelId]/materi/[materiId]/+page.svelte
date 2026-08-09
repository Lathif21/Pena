<script lang="ts">
  import SubMateriTable from '$features/module/components/SubMateriTable.svelte'

  let { data } = $props()
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-6">
      <a
        href="/kepala-guru/konten/{data.mapel.id}/materi"
        class="text-sm font-medium text-primary hover:underline"
      >
        ← Kembali ke {data.mapel.nama}
      </a>
    </div>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{data.materi.nama}</h1>
        <p class="mt-1 text-sm text-gray-500">
          Sub materi urut {data.materi.nomor_urut} · {data.mapel.nama}
          
        </p>
      </div>
      <a
        href="/kepala-guru/konten/{data.mapel.id}/materi/{data.materi.id}/try-out"
        class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Kelola Try Out
      </a>
    </div>

    <SubMateriTable
      materiId={data.materi.id}
      materiNama={data.materi.nama}
      mapelId={data.mapel.id}
    />
  </div>
</div>
