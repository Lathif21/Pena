-- Selesai Mengajar dalam satu transaksi.
--
-- Tiga query terpisah dari klien bisa gagal di tengah dan meninggalkan sesi
-- setengah tertutup — sesi `closed` dengan jurnal masih `draft` — yang merusak
-- perhitungan kelengkapan jurnal di KPI Fase 5. Function ini membuat ketiganya
-- berhasil bersama atau gagal bersama.
--
-- Dua penjagaan di bawah tidak ada di draft rancangan awal, tapi diperlukan:
--   * tanpa cek status, pemanggilan kedua diam-diam "berhasil" walau 0 baris
--     terupdate, padahal seharusnya ditolak karena sesi sudah ditutup;
--   * FOR UPDATE mengunci baris sesi, supaya dua klik beruntun tidak lolos berdua.
create or replace function close_sesi(p_sesi_id uuid)
returns void
language plpgsql
as $$
declare
  v_status text;
begin
  select status into v_status
    from sesi_mengajar
   where id = p_sesi_id and deleted_at is null
     for update;

  if v_status is null then
    raise exception 'Sesi tidak ditemukan';
  end if;

  if v_status <> 'open' then
    raise exception 'Sesi sudah ditutup';
  end if;

  if not exists (
    select 1 from jurnal_mengajar
     where sesi_id = p_sesi_id and deleted_at is null
  ) then
    raise exception 'Jurnal mengajar belum diisi';
  end if;

  update sesi_mengajar
     set ended_at = now(), status = 'closed'
   where id = p_sesi_id;

  update jurnal_mengajar
     set status = 'submitted', submitted_at = now()
   where sesi_id = p_sesi_id and deleted_at is null;
end;
$$;

grant execute on function close_sesi(uuid) to authenticated, service_role;
