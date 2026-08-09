<script lang="ts">
  import { goto } from '$app/navigation'
  import { enhance } from '$app/forms'

  let { data } = $props()
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard Kepala Guru</h1>
        <p class="mt-1 text-sm text-gray-500">Selamat datang, {data.profile.nama_lengkap}</p>
      </div>
      <form method="POST" action="?/logout" use:enhance>
        <button
          type="submit"
          class="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Logout
        </button>
      </form>
    </div>

    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <a href="/kepala-guru/master-data/mapel" class="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-primary">
        <p class="text-sm text-gray-500">Mata Pelajaran</p>
        <p class="mt-2 text-3xl font-bold text-gray-900">{data.stats.mapel}</p>
      </a>
      <a href="/kepala-guru/master-data/kelas" class="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-primary">
        <p class="text-sm text-gray-500">Kelas</p>
        <p class="mt-2 text-3xl font-bold text-gray-900">{data.stats.kelas}</p>
      </a>
      <a href="/kepala-guru/akun/siswa" class="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-primary">
        <p class="text-sm text-gray-500">Siswa</p>
        <p class="mt-2 text-3xl font-bold text-gray-900">{data.stats.siswa}</p>
      </a>
      <a href="/kepala-guru/akun/tentor" class="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-primary">
        <p class="text-sm text-gray-500">Tentor</p>
        <p class="mt-2 text-3xl font-bold text-gray-900">{data.stats.tentor}</p>
      </a>
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Menu</h2>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onclick={() => goto('/kepala-guru/konten')}
          class="rounded-md bg-indigo-50 px-4 py-3 text-left text-indigo-700 hover:bg-indigo-100"
        >
          📚 Kelola Konten
        </button>
        <button
          onclick={() => goto('/kepala-guru/master-data/tahun-ajaran')}
          class="rounded-md bg-gray-50 px-4 py-3 text-left text-gray-700 hover:bg-gray-100"
        >
          📅 Tahun Ajaran
        </button>
        <button
          onclick={() => goto('/kepala-guru/akun/wali')}
          class="rounded-md bg-gray-50 px-4 py-3 text-left text-gray-700 hover:bg-gray-100"
        >
          👪 Akun Wali Murid
        </button>
        <button
          onclick={() => goto('/kepala-guru/assignment')}
          class="rounded-md bg-gray-50 px-4 py-3 text-left text-gray-700 hover:bg-gray-100"
        >
          🧩 Assignment Tentor
        </button>
        <button
          onclick={() => goto('/kepala-guru/monitoring/attempt')}
          class="rounded-md bg-indigo-50 px-4 py-3 text-left text-indigo-700 hover:bg-indigo-100"
        >
          🔄 Reset Attempt Try Out
        </button>
        <button
          onclick={() => goto('/tentor/dashboard')}
          class="rounded-md bg-gray-50 px-4 py-3 text-left text-gray-700 hover:bg-gray-100"
        >
          👨‍🏫 Dashboard Tentor
        </button>
      </div>
    </div>
  </div>
</div>
