/**
 * Public URL for a module PDF.
 *
 * Module PDFs live on the server filesystem under static/, which SvelteKit serves at
 * the web root — so the URL is just the stored path. There is no bucket and no signing
 * step; calling supabase.storage for a module returns "Object not found".
 *
 * Kept free of imports so both server loaders and browser code can use it.
 */
export function getModuleUrl(storagePath: string) {
  return `/${storagePath.replace(/^\/+/, '')}`
}
