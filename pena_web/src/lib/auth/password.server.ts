import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

// Parameter scrypt. N=16384 butuh ~16MB per hash — aman di VPS 2GB untuk login
// yang jarang, dan jauh di atas ambang yang bisa di-brute force massal.
const N = 16384
const r = 8
const p = 1
const KEYLEN = 32

/** Format: scrypt$N$r$p$salt_hex$hash_hex */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = (await scryptAsync(password, salt, KEYLEN, { N, r, p })) as Buffer
  return ['scrypt', N, r, p, salt.toString('hex'), key.toString('hex')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const bagian = stored.split('$')
  // Akun yang belum pernah diberi password punya penanda, bukan hash — tolak
  // tanpa menyentuh scrypt.
  if (bagian.length !== 6 || bagian[0] !== 'scrypt') return false

  const [, nStr, rStr, pStr, saltHex, hashHex] = bagian
  const salt = Buffer.from(saltHex, 'hex')
  const diharapkan = Buffer.from(hashHex, 'hex')

  const key = (await scryptAsync(password, salt, diharapkan.length, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr)
  })) as Buffer

  // Panjang harus dicek dulu: timingSafeEqual melempar kalau berbeda panjang.
  if (key.length !== diharapkan.length) return false
  return timingSafeEqual(key, diharapkan)
}
