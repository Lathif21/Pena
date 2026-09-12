<script lang="ts">
  import { pesanRamah } from '$lib/utils/pesan'
  import { invalidateAll } from '$app/navigation'
  import { createRelief, cancelRelief } from '$features/relief/data/relief'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import { CalendarX, TriangleAlert } from 'lucide-svelte'

  let { data } = $props()

  let kelasId = $state('')
  let mapelId = $state('')
  let penggantiId = $state('')
  let tanggal = $state(data.hariIni)
  let task = $state('')

  let loading = $state(false)
  let error = $state('')
  let message = $state('')
  let peringatanEmail = $state('')
  let membatalkan = $state<string | null>(null)

  // Kelas unik dari daftar kombinasi; mapel menyusul setelah kelas dipilih.
  let kelasPilihan = $derived(
    [...new Map(data.kelasMapel.map((k) => [k.kelasId, k])).values()].map((k) => ({
      id: k.kelasId,
      nama: k.kelasNama
    }))
  )

  let mapelPilihan = $derived(
    data.kelasMapel
      .filter((k) => k.kelasId === kelasId)
      .map((k) => ({ id: k.mapelId, nama: k.mapelNama }))
  )

  // Kelas berganti berarti mapel lama belum tentu masih sah.
  function pilihKelas(id: string) {
    kelasId = id
    mapelId = ''
  }

  async function ajukan(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = ''
    message = ''
    peringatanEmail = ''

    try {
      const hasil = await createRelief({ penggantiId, kelasId, mapelId, tanggal, task })
      message = 'Relief tersimpan dan pengganti sudah diberi tahu.'
      if (hasil.emailError) {
        peringatanEmail = hasil.emailError
        message = 'Relief tersimpan.'
      }
      kelasId = ''
      mapelId = ''
      penggantiId = ''
      task = ''
      await invalidateAll()
    } catch (err) {
      error = pesanRamah(err, 'Gagal mengajukan relief')
    } finally {
      loading = false
    }
  }

  async function batalkan(id: string) {
    if (!confirm('Batalkan relief ini? Pengganti akan diberi tahu.')) return
    membatalkan = id
    error = ''
    message = ''
    peringatanEmail = ''

    try {
      const hasil = await cancelRelief(id)
      message = 'Relief dibatalkan.'
      if (hasil.emailError) peringatanEmail = hasil.emailError
      await invalidateAll()
    } catch (err) {
      error = pesanRamah(err, 'Gagal membatalkan relief')
    } finally {
      membatalkan = null
    }
  }

  const tanggalPanjang = (iso: string) =>
    new Date(`${iso}T00:00:00+07:00`).toLocaleDateString('id-ID', { dateStyle: 'full' })

  const gayaField =
    'mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none disabled:opacity-50'
</script>

<svelte:head>
  <title>Relief · Pena</title>
</svelte:head>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Relief</h1>
  <p class="mt-1 text-sm text-muted-foreground">
    Berhalangan mengajar? Tunjuk tentor pengganti — dia dan kepala guru akan diberi tahu lewat
    email.
  </p>
</div>

{#if error}
  <div class="mb-4 rounded-lg bg-red-100 p-4"><p class="text-sm text-red-800">{error}</p></div>
{/if}
{#if message}
  <div class="mb-4 rounded-lg bg-emerald-100 p-4">
    <p class="text-sm text-emerald-800">✓ {message}</p>
  </div>
{/if}
{#if peringatanEmail}
  <div class="mb-4 rounded-lg bg-amber-100 p-4">
    <p class="text-sm font-medium text-amber-800">Email gagal terkirim</p>
    <p class="mt-1 text-sm text-amber-800">
      Reliefnya tetap berlaku dan pengganti tetap berwenang membuka sesi — tapi dia belum tahu.
      Hubungi dia langsung.
    </p>
    <p class="mt-2 font-mono text-xs text-amber-800">{peringatanEmail}</p>
  </div>
{/if}

{#if data.kelasMapel.length === 0}
  <Card class="p-8 text-center">
    <CalendarX class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">
      Anda belum diassign ke kelas mana pun, jadi belum ada yang bisa direliefkan.
    </p>
  </Card>
{:else}
  <Card class="mb-6">
    <h2 class="mb-4 font-serif text-lg text-foreground">Ajukan Relief</h2>

    <form onsubmit={ajukan} class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="kelas" class="block text-sm font-medium text-foreground">Kelas</label>
          <select
            id="kelas"
            value={kelasId}
            onchange={(e) => pilihKelas((e.currentTarget as HTMLSelectElement).value)}
            required
            class="{gayaField} pr-8"
          >
            <option value="">Pilih kelas...</option>
            {#each kelasPilihan as k (k.id)}
              <option value={k.id}>{k.nama}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="mapel" class="block text-sm font-medium text-foreground">Mata Pelajaran</label>
          <select
            id="mapel"
            bind:value={mapelId}
            disabled={!kelasId}
            required
            class="{gayaField} pr-8"
          >
            <option value="">{kelasId ? 'Pilih mapel...' : 'Pilih kelas dulu'}</option>
            {#each mapelPilihan as m (m.id)}
              <option value={m.id}>{m.nama}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="pengganti" class="block text-sm font-medium text-foreground">
            Tentor Pengganti
          </label>
          <select id="pengganti" bind:value={penggantiId} required class="{gayaField} pr-8">
            <option value="">Pilih tentor...</option>
            {#each data.tentorLain as t (t.id)}
              <option value={t.id}>{t.nama}</option>
            {/each}
          </select>
          {#if data.tentorLain.length === 0}
            <p class="mt-1 text-xs text-amber-800">Belum ada tentor lain yang bisa ditunjuk.</p>
          {/if}
        </div>

        <div>
          <label for="tanggal" class="block text-sm font-medium text-foreground">Tanggal</label>
          <!-- min mencegah tanggal lampau di UI; endpoint tetap memeriksanya lagi. -->
          <input
            id="tanggal"
            type="date"
            bind:value={tanggal}
            min={data.hariIni}
            required
            class={gayaField}
          />
        </div>
      </div>

      <div>
        <label for="task" class="block text-sm font-medium text-foreground">Task Delegasi</label>
        <textarea
          id="task"
          bind:value={task}
          rows={4}
          required
          placeholder="Materi apa yang harus diajarkan, sampai mana, catatan khusus..."
          class={gayaField}
        ></textarea>
        <p class="mt-1 text-xs text-muted-foreground">
          Sistem tidak punya jadwal, jadi pengganti melihat seluruh modul mapel ini. Tulis arahanmu
          di sini.
        </p>
      </div>

      <Button type="submit" disabled={loading} class="w-full sm:w-auto">
        {loading ? 'Mengirim...' : 'Ajukan Relief'}
      </Button>
    </form>
  </Card>
{/if}

<h2 class="mb-3 font-serif text-lg text-foreground">Relief yang Anda Ajukan</h2>

{#if data.relief.length === 0}
  <Card class="p-8 text-center">
    <CalendarX class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">Belum ada pengajuan relief.</p>
  </Card>
{:else}
  <div class="space-y-3">
    {#each data.relief as r (r.id)}
      <Card>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium text-foreground">{r.kelasNama} · {r.mapelNama}</p>
            <p class="mt-1 font-mono text-sm text-muted-foreground">{tanggalPanjang(r.tanggal)}</p>
            <p class="mt-1 text-sm text-muted-foreground">Pengganti: {r.penggantiNama}</p>
          </div>
          <Badge tone={r.status === 'aktif' ? 'success' : 'pending'}>
            {r.status === 'aktif' ? 'Aktif' : 'Dibatalkan'}
          </Badge>
        </div>

        <div class="mt-3 rounded-lg bg-muted/30 p-3">
          <p class="text-xs font-medium text-muted-foreground">Task delegasi</p>
          <p class="mt-1 whitespace-pre-wrap text-sm text-foreground">{r.task}</p>
        </div>

        {#if r.emailError}
          <div class="mt-3 flex items-start gap-2 rounded-lg bg-amber-100 p-3">
            <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
            <p class="text-xs text-amber-800">
              Email ke pengganti gagal terkirim. Relief tetap berlaku — hubungi dia langsung.
            </p>
          </div>
        {/if}

        {#if r.status === 'aktif'}
          <Button
            variant="destructive"
            class="mt-3"
            onclick={() => batalkan(r.id)}
            disabled={membatalkan === r.id}
          >
            {membatalkan === r.id ? 'Membatalkan...' : 'Batalkan'}
          </Button>
        {/if}
      </Card>
    {/each}
  </div>
{/if}
