-- Soal untuk try out sebelumnya menempel ke materi, sehingga semua try out pada
-- materi yang sama terpaksa berbagi satu kumpulan soal. Sekarang soal menempel
-- langsung ke try out, supaya tiap try out punya soalnya sendiri.

alter table soal add column try_out_id uuid references try_out(id);

-- Constraint lama harus dilepas dulu: selama proses ini sebuah baris sah punya
-- try_out_id tanpa materi_id, yang dilarang oleh aturan lama.
alter table soal drop constraint soal_check;

-- Soal yang ada diberikan ke try out paling awal dari materinya.
update soal s
set try_out_id = (
  select t.id
  from try_out t
  where t.materi_id = s.materi_id
    and t.deleted_at is null
  order by t.created_at
  limit 1
)
where s.materi_id is not null;

-- Lalu disalin untuk try out lain pada materi yang sama, supaya tidak ada try out
-- yang kehilangan soalnya (dan nilai attempt lama tetap punya acuan).
do $$
declare
  rec_try_out record;
  rec_soal record;
  soal_baru uuid;
begin
  for rec_try_out in
    select to_lain.id as try_out_id, to_lain.materi_id
    from try_out to_lain
    where to_lain.deleted_at is null
      and to_lain.id <> (
        select to_awal.id from try_out to_awal
        where to_awal.materi_id = to_lain.materi_id and to_awal.deleted_at is null
        order by to_awal.created_at limit 1
      )
  loop
    for rec_soal in
      select s.id, s.pertanyaan, s.nomor_urut
      from soal s
      where s.materi_id = rec_try_out.materi_id
        and s.deleted_at is null
        and s.try_out_id <> rec_try_out.try_out_id
      order by s.nomor_urut
    loop
      insert into soal (try_out_id, pertanyaan, nomor_urut)
      values (rec_try_out.try_out_id, rec_soal.pertanyaan, rec_soal.nomor_urut)
      returning id into soal_baru;

      insert into pilihan_jawaban (soal_id, teks, is_benar, nomor_urut)
      select soal_baru, p.teks, p.is_benar, p.nomor_urut
      from pilihan_jawaban p
      where p.soal_id = rec_soal.id
        and p.deleted_at is null;
    end loop;
  end loop;
end $$;

drop index if exists idx_soal_materi_id;
alter table soal drop column materi_id;

-- Induk soal sekarang: sub_materi (latihan) atau try_out (try out), tepat satu.
alter table soal add constraint soal_satu_induk
  check (num_nonnulls(sub_materi_id, try_out_id) = 1);

create index idx_soal_try_out_id on soal(try_out_id) where deleted_at is null;
