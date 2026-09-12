import { pesanRamah } from '$lib/utils/pesan'
import { redirect, fail } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const parentData = await parent()

  // Check if already authenticated
  if (parentData.user) {
    redirect(303, '/kepala-guru/dashboard')
  }
}

export const actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return fail(400, { error: 'Email dan password wajib diisi' })
    }

    const supabase = createSupabaseServerClient(cookies)

    // Sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      console.error('Supabase signin error:', signInError)
      return fail(400, { error: pesanRamah(signInError, 'Email atau password salah') })
    }
    if (!signInData.user) {
      return fail(400, { error: 'Login gagal. Coba lagi sebentar.' })
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', signInData.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return fail(400, { error: pesanRamah(profileError, 'Profil tidak ditemukan') })
    }
    if (!profile) {
      return fail(400, { error: 'Profil tidak ditemukan' })
    }

    // Redirect based on role
    const dashboardMap: Record<string, string> = {
      kepala_guru: '/kepala-guru/dashboard',
      tentor: '/tentor/dashboard',
      siswa: '/siswa/dashboard',
      wali_murid: '/wali/dashboard'
    }

    const redirectPath = dashboardMap[profile.role] || '/siswa/dashboard'
    redirect(303, redirectPath)
  }
}
