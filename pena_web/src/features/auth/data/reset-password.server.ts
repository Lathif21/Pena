import { randomInt } from 'node:crypto'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { hashPassword, verifyPassword } from '$lib/auth/password.server'
import { kirimKodeReset } from '$lib/email/reset-password'
import { MENIT_BERLAKU, MAKS_PERCOBAAN, tolakPermintaan, tolakKode } from './aturan-reset.js'

const TIDAK_TERDAFTAR =
  'Email ini tidak terdaftar di Pena. Periksa ejaannya, atau hubungi kepala guru.'

const kini = () => new Date().toISOString()

/** Akun aktif pemilik email. Akun yang sudah dihapus dianggap tidak terdaftar. */
async function cariAkun(email: string) {
  const bersih = email.trim()
  if (!bersih) throw new Error('Email wajib diisi.')

  // ilike supaya huruf besar-kecil tidak berpengaruh, sama seperti login. % dan _
  // di-escape: tanpa itu "%@gmail.com" cocok ke akun orang lain.
  const { data: user, error } = await supabaseAdmin
    .from('app_users')
    .select('id, email')
    .ilike('email', bersih.replace(/[\\%_]/g, '\\$&'))
    .maybeSingle()
  if (error) throw error
  if (!user) throw new Error(TIDAK_TERDAFTAR)

  const { data: profil, error: profilError } = await supabaseAdmin
    .from('profiles')
    .select('nama_lengkap')
    .eq('id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  if (profilError) throw profilError
  if (!profil) throw new Error(TIDAK_TERDAFTAR)

  return { id: user.id as string, email: user.email as string, nama: profil.nama_lengkap as string }
}

/** Membuat kode baru dan mengirimnya ke email akun. Mengembalikan alamat tujuannya. */
export async function mintaKodeReset(email: string) {
  const akun = await cariAkun(email)
  const sekarang = Date.now()

  const { data: riwayat, error } = await supabaseAdmin
    .from('reset_password')
    .select('created_at')
    .eq('user_id', akun.id)
    .gte('created_at', new Date(sekarang - 86_400_000).toISOString())
  if (error) throw error

  const alasan = tolakPermintaan((riwayat ?? []).map((r) => r.created_at as string), sekarang)
  if (alasan) throw new Error(alasan)

  // Kode lama dimatikan (used_at diisi walau tidak pernah dipakai): hanya kode
  // di email terbaru yang berlaku, supaya pengguna tidak bingung memilih.
  const { error: batalError } = await supabaseAdmin
    .from('reset_password')
    .update({ used_at: kini() })
    .eq('user_id', akun.id)
    .is('used_at', null)
  if (batalError) throw batalError

  const kode = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const { data: baris, error: simpanError } = await supabaseAdmin
    .from('reset_password')
    .insert({
      user_id: akun.id,
      // Disimpan sebagai hash: siapa pun yang membaca tabel ini tidak bisa memakainya.
      kode_hash: await hashPassword(kode),
      expires_at: new Date(sekarang + MENIT_BERLAKU * 60_000).toISOString()
    })
    .select('id')
    .single()
  if (simpanError) throw simpanError

  try {
    await kirimKodeReset({ kepada: akun.email, nama: akun.nama, kode, menitBerlaku: MENIT_BERLAKU })
  } catch (err) {
    console.error('Gagal mengirim kode reset password:', err)
    await supabaseAdmin.from('reset_password').update({ used_at: kini() }).eq('id', baris.id)
    throw new Error('Email gagal dikirim. Coba lagi sebentar, atau hubungi kepala guru.')
  }

  return akun.email
}

/** Memeriksa kode lalu mengganti password. Semua sesi akun itu ikut dibuang. */
export async function gantiPasswordDenganKode(email: string, kode: string, password: string) {
  const kodeBersih = kode.trim()
  if (!/^\d{6}$/.test(kodeBersih)) throw new Error('Kode harus 6 angka.')
  if (password.length < 8) throw new Error('Password minimal 8 karakter.')

  const akun = await cariAkun(email)

  const { data: baris, error } = await supabaseAdmin
    .from('reset_password')
    .select('id, kode_hash, percobaan, expires_at, used_at')
    .eq('user_id', akun.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error

  const alasan = tolakKode(baris, Date.now())
  if (alasan || !baris) throw new Error(alasan ?? 'Minta kode baru.')

  // Hitungan dinaikkan SEBELUM kode diperiksa, dan hanya kalau belum berubah sejak
  // dibaca. Tanpa itu, 100 tebakan yang dikirim bersamaan semuanya membaca
  // percobaan = 0 dan semuanya lolos batas 5 kali.
  const { data: naik, error: naikError } = await supabaseAdmin
    .from('reset_password')
    .update({ percobaan: baris.percobaan + 1 })
    .eq('id', baris.id)
    .eq('percobaan', baris.percobaan)
    .is('used_at', null)
    .select('id')
  if (naikError) throw naikError
  if (!naik?.length) throw new Error('Kode sedang diperiksa dari tempat lain. Coba lagi.')

  if (!(await verifyPassword(kodeBersih, baris.kode_hash as string))) {
    const sisa = MAKS_PERCOBAAN - (baris.percobaan + 1)
    throw new Error(
      sisa > 0 ? `Kode salah. Sisa percobaan: ${sisa}.` : 'Kode salah dan batas percobaan habis. Minta kode baru.'
    )
  }

  // Sesi dibuang lebih dulu: kalau langkah ini gagal, kodenya masih bisa dipakai
  // ulang. Sebaliknya, kalau dibuang setelah password diganti lalu gagal, sesi
  // yang dibuka dengan password lama tetap hidup.
  const { error: sesiError } = await supabaseAdmin.from('sessions').delete().eq('user_id', akun.id)
  if (sesiError) throw sesiError

  const { data: dipakai, error: pakaiError } = await supabaseAdmin
    .from('reset_password')
    .update({ used_at: kini() })
    .eq('id', baris.id)
    .is('used_at', null)
    .select('id')
  if (pakaiError) throw pakaiError
  if (!dipakai?.length) throw new Error('Kode ini sudah dipakai. Minta kode baru kalau perlu.')

  const { error: pwError } = await supabaseAdmin
    .from('app_users')
    .update({ password_hash: await hashPassword(password) })
    .eq('id', akun.id)
  if (pwError) {
    console.error('Gagal menyimpan password baru:', pwError)
    throw new Error('Password gagal disimpan. Minta kode baru lalu coba lagi.')
  }
}
