-- Module (PDF learning material for a sub_materi)
create table module (
  id uuid primary key default gen_random_uuid(),
  sub_materi_id uuid not null unique references sub_materi(id),
  status text not null check(status in ('draft', 'published')),
  storage_path text not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint published_needs_timestamp check((status = 'published') = (published_at is not null))
);

-- Index for module lookups
create index idx_module_sub_materi on module(sub_materi_id) where deleted_at is null;
