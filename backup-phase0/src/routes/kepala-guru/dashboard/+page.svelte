<script lang="ts">
  import { goto } from '$app/navigation'
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
    <div class="rounded-lg bg-white p-8 shadow-lg">
      <h1 class="mb-2 text-4xl font-bold text-gray-900">
        Dashboard Kepala Guru
      </h1>
      <p class="mb-8 text-gray-600">
        Kelola seluruh aspek operasional bimbingan belajar Anda
      </p>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Master Data Section -->
        <div class="rounded-lg border-2 border-gray-200 p-6">
          <h2 class="mb-4 text-xl font-semibold text-gray-900">Data Master</h2>
          <div class="space-y-2">
            <button
              on:click={() => goto('/kepala-guru/master-data/tahun-ajaran')}
              class="block w-full rounded-md bg-blue-50 px-4 py-3 text-left text-blue-700 hover:bg-blue-100"
            >
              📅 Tahun Ajaran
            </button>
            <button
              on:click={() => goto('/kepala-guru/master-data/kelas')}
              class="block w-full rounded-md bg-blue-50 px-4 py-3 text-left text-blue-700 hover:bg-blue-100"
            >
              🏫 Kelas
            </button>
            <button
              on:click={() => goto('/kepala-guru/master-data/mapel')}
              class="block w-full rounded-md bg-blue-50 px-4 py-3 text-left text-blue-700 hover:bg-blue-100"
            >
              📚 Mata Pelajaran
            </button>
          </div>
        </div>

        <!-- Account Management Section -->
        <div class="rounded-lg border-2 border-gray-200 p-6">
          <h2 class="mb-4 text-xl font-semibold text-gray-900">Kelola Akun</h2>
          <div class="space-y-2">
            <button
              on:click={() => goto('/kepala-guru/akun/tentor')}
              class="block w-full rounded-md bg-purple-50 px-4 py-3 text-left text-purple-700 hover:bg-purple-100"
            >
              👨‍🏫 Tentor
            </button>
            <button
              on:click={() => goto('/kepala-guru/akun/siswa')}
              class="block w-full rounded-md bg-purple-50 px-4 py-3 text-left text-purple-700 hover:bg-purple-100"
            >
              👨‍🎓 Siswa
            </button>
            <button
              on:click={() => goto('/kepala-guru/akun/wali')}
              class="block w-full rounded-md bg-purple-50 px-4 py-3 text-left text-purple-700 hover:bg-purple-100"
            >
              👨‍👩‍👧 Wali Murid
            </button>
          </div>
        </div>

        <!-- Assignment Section -->
        <div class="rounded-lg border-2 border-gray-200 p-6">
          <h2 class="mb-4 text-xl font-semibold text-gray-900">Penugasan</h2>
          <div class="space-y-2">
            <button
              on:click={() => goto('/kepala-guru/assignment')}
              class="block w-full rounded-md bg-green-50 px-4 py-3 text-left text-green-700 hover:bg-green-100"
            >
              🎯 Assignment Tentor
            </button>
          </div>
        </div>

        <!-- Additional Options -->
        <div class="rounded-lg border-2 border-gray-200 p-6">
          <h2 class="mb-4 text-xl font-semibold text-gray-900">Opsi</h2>
          <div class="space-y-2">
            <button
              on:click={() => goto('/tentor/dashboard')}
              class="block w-full rounded-md bg-orange-50 px-4 py-3 text-left text-orange-700 hover:bg-orange-100"
            >
              📊 Dashboard Tentor
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
