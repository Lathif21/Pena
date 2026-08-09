<script lang="ts">
  import { goto } from '$app/navigation'

  let { data } = $props()
  let selectedMapelId = $state('')
  let selectedKelasId = $state('')
  let nilaiBulk = $state<Map<string, any>>(new Map())
  let loading = $state(false)
  let error = $state('')

  async function loadNilai() {
    if (!selectedMapelId) { nilaiBulk = new Map(); return }
    loading = true; error = ''
    try {
      const supabase = (await import('$lib/supabase/client')).supabase
      let query = supabase.from('siswa_detail').select('id, nama_lengkap')
      if (selectedKelasId) {
        const { data: siswaKelasData } = await supabase.from('siswa_kelas').select('siswa_detail_id').eq('kelas_id', selectedKelasId).is('deleted_at', null)
        const siswaIds = siswaKelasData?.map(sk => sk.siswa_detail_id) || []
        if (siswaIds.length === 0) { nilaiBulk = new Map(); return }
        query = query.in('id', siswaIds)
      }
      const { data: siswaList } = await query.is('deleted_at', null).order('nama_lengkap')
      if (!siswaList) return
      const siswaMap = new Map<string, any>()
      siswaList.forEach(s => {
        siswaMap.set(s.id, { id: s.id, nama: s.nama_lengkap, nilaiBelajar: [], nilaiManual: [], rataRata: 0 })
      })
      const { data: attempts } = await supabase.from('attempt').select('siswa_detail_id, nilai, submitted_at').eq('is_active', true).in('siswa_detail_id', siswaList.map(s => s.id)).not('nilai', 'is', null).is('deleted_at', null)
      if (attempts) {
        attempts.forEach(a => {
          const siswa = siswaMap.get(a.siswa_detail_id)
          if (siswa) siswa.nilaiBelajar.push({ nilai: a.nilai, tipe: 'Try Out', tanggal: new Date(a.submitted_at).toLocaleDateString('id-ID') })
        })
      }
      const { data: nilaiManual } = await supabase.from('nilai_manual').select('siswa_detail_id, nilai, judul, tanggal, tipe_test').eq('mapel_id', selectedMapelId).in('siswa_detail_id', siswaList.map(s => s.id)).is('deleted_at', null).order('tanggal', { ascending: false })
      if (nilaiManual) {
        nilaiManual.forEach(nm => {
          const siswa = siswaMap.get(nm.siswa_detail_id)
          if (siswa) siswa.nilaiManual.push({ nilai: nm.nilai, tipe: nm.tipe_test === 'pre_test' ? 'Pre-Test' : nm.tipe_test === 'post_test' ? 'Post-Test' : 'Try Out', judul: nm.judul, tanggal: new Date(nm.tanggal).toLocaleDateString('id-ID') })
        })
      }
      siswaMap.forEach((siswa, _) => {
        const allNilai = [...siswa.nilaiBelajar.map(n => n.nilai), ...siswa.nilaiManual.map(n => n.nilai)]
        siswa.rataRata = allNilai.length > 0 ? Math.round(allNilai.reduce((a, b) => a + b, 0) / allNilai.length) : 0
      })
      nilaiBulk = siswaMap
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal memuat nilai'
      nilaiBulk = new Map()
    } finally {
      loading = false
    }
  }

  function calculateRataRataKelas() {
    const allRata = Array.from(nilaiBulk.values()).map(s => s.rataRata).filter(r => r > 0)
    return allRata.length > 0 ? Math.round(allRata.reduce((a, b) => a + b, 0) / allRata.length) : 0
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nilai Siswa</h1>
        <p class="mt-1 text-sm text-gray-600">Lihat nilai e-learning dan nilai manual per siswa</p>
      </div>
      <button onclick={() => goto('/tentor/nilai/input')} class="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-hover">+ Input Nilai Manual</button>
    </div>

    <div class="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Filter</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="mapel" class="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
          <select id="mapel" bind:value={selectedMapelId} onchange={loadNilai} class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2">
            <option value="">Pilih Mapel...</option>
            {#each data.mapel as m (m.id)}
              <option value={m.id}>{m.nama}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="kelas" class="block text-sm font-medium text-gray-700">Kelas (Opsional)</label>
          <select id="kelas" bind:value={selectedKelasId} onchange={loadNilai} disabled={!selectedMapelId} class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2 disabled:bg-gray-50">
            <option value="">Semua Kelas</option>
            {#each data.kelas as k (k.id)}
              <option value={k.id}>{k.nama}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    {#if error}
      <div class="mb-4 rounded-md bg-red-50 p-4"><p class="text-sm text-red-800">{error}</p></div>
    {/if}

    {#if loading}
      <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center"><p class="text-gray-600">Memuat nilai...</p></div>
    {:else if !selectedMapelId}
      <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center"><p class="text-gray-600">Pilih mapel untuk melihat nilai siswa</p></div>
    {:else if nilaiBulk.size === 0}
      <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center"><p class="text-gray-600">Belum ada data nilai untuk filter ini</p></div>
    {:else}
      <div class="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div class="text-center">
          <p class="text-sm font-medium text-emerald-700 mb-1">Rata-rata Kelas</p>
          <div class="text-3xl font-bold text-emerald-600">{calculateRataRataKelas()}</div>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50">
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama Siswa</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">E-Learning</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">Nilai Manual</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {#each Array.from(nilaiBulk.values()).sort((a, b) => b.rataRata - a.rataRata) as siswa (siswa.id)}
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="px-6 py-4 text-sm text-gray-900 font-medium">{siswa.nama}</td>
                  <td class="px-6 py-4 text-center">
                    {#if siswa.nilaiBelajar.length > 0}
                      <div class="flex flex-col gap-1">
                        {#each siswa.nilaiBelajar as nilai}
                          <span class="inline-block rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{nilai.nilai}</span>
                        {/each}
                      </div>
                    {:else}
                      <span class="text-gray-400">—</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-center">
                    {#if siswa.nilaiManual.length > 0}
                      <div class="flex flex-col gap-1">
                        {#each siswa.nilaiManual as nilai}
                          <div class="text-xs"><span class="block font-medium text-gray-900">{nilai.nilai}</span><span class="text-gray-500">{nilai.judul}</span></div>
                        {/each}
                      </div>
                    {:else}
                      <span class="text-gray-400">—</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-bold ${siswa.rataRata >= 80 ? 'bg-emerald-50 text-emerald-700' : siswa.rataRata >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                      {siswa.rataRata}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>
