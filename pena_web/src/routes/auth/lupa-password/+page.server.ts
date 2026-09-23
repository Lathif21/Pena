import { fail, redirect } from '@sveltejs/kit'
import { pesanRamah } from '$lib/utils/pesan'
import { mintaKodeReset, gantiPasswordDenganKode } from '$features/auth/data/reset-password.server'

const teks = (form: FormData, nama: string) => String(form.get(nama) ?? '')

export const actions = {
  kirim: async ({ request }) => {
    const form = await request.formData()
    const email = teks(form, 'email').trim()

    try {
      await mintaKodeReset(email)
    } catch (err) {
      // `terkirim` ikut dikembalikan supaya "Kirim ulang" yang ditolak (misalnya
      // karena jeda 1 menit) tidak melempar pengguna kembali ke langkah pertama.
      return fail(400, {
        email,
        terkirim: form.get('ulang') === '1',
        error: pesanRamah(err, 'Gagal mengirim kode. Coba lagi sebentar.')
      })
    }

    return { email, terkirim: true, ulang: form.get('ulang') === '1' }
  },

  ganti: async ({ request }) => {
    const form = await request.formData()
    const email = teks(form, 'email').trim()

    try {
      await gantiPasswordDenganKode(email, teks(form, 'kode'), teks(form, 'password'))
    } catch (err) {
      return fail(400, {
        email,
        terkirim: true,
        error: pesanRamah(err, 'Gagal mengganti password. Coba lagi sebentar.')
      })
    }

    redirect(303, '/auth/login?password=diganti')
  }
}
