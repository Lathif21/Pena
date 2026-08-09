import { supabase } from '$lib/supabase/client'

export interface Module {
  id: string
  sub_materi_id: string
  status: 'draft' | 'published'
  storage_path: string
  published_at: string | null
  created_at: string
  deleted_at: string | null
}

export async function getModuleBySubMateri(subMateriId: string) {
  const { data, error } = await supabase
    .from('module')
    .select('id, sub_materi_id, status, storage_path, published_at, created_at, deleted_at')
    .eq('sub_materi_id', subMateriId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return data as Module | null
}

export async function uploadModule(subMateriId: string, file: File) {
  // Check if module already exists
  const existing = await getModuleBySubMateri(subMateriId)

  const fileName = `${subMateriId}-${Date.now()}.pdf`
  const storagePath = `modul/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage.from('modul-pdf').upload(storagePath, file, {
    upsert: true
  })

  if (uploadError) throw uploadError

  if (existing) {
    // Update existing draft
    if (existing.status === 'published') throw new Error('Tidak bisa ganti PDF yang sudah dipublish')

    // Delete old file
    if (existing.storage_path) {
      await supabase.storage.from('modul-pdf').remove([existing.storage_path])
    }

    const { data, error } = await supabase
      .from('module')
      .update({
        storage_path: storagePath,
        status: 'draft'
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data as Module
  }

  // Create new draft
  const { data, error } = await supabase
    .from('module')
    .insert({
      sub_materi_id: subMateriId,
      status: 'draft',
      storage_path: storagePath
    })
    .select()
    .single()

  if (error) throw error
  return data as Module
}

export async function publishModule(id: string) {
  const { data: current, error: fetchError } = await supabase
    .from('module')
    .select('status, published_at')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError
  if (current?.status === 'published') throw new Error('Module sudah dipublish')

  const { data, error } = await supabase
    .from('module')
    .update({
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Module
}

export async function replaceModule(id: string, file: File) {
  const { data: current, error: fetchError } = await supabase
    .from('module')
    .select('status, storage_path')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError
  if (current?.status === 'published') throw new Error('Tidak bisa ganti PDF yang sudah dipublish')

  const fileName = `${id}-${Date.now()}.pdf`
  const storagePath = `modul/${fileName}`

  // Upload new file
  const { error: uploadError } = await supabase.storage.from('modul-pdf').upload(storagePath, file, {
    upsert: true
  })

  if (uploadError) throw uploadError

  // Delete old file
  if (current?.storage_path) {
    await supabase.storage.from('modul-pdf').remove([current.storage_path])
  }

  // Update record
  const { data, error } = await supabase
    .from('module')
    .update({ storage_path: storagePath })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Module
}

export async function getSignedUrl(storagePath: string) {
  const { data, error } = await supabase.storage.from('modul-pdf').createSignedUrl(storagePath, 3600)

  if (error) throw error
  return data.signedUrl
}
