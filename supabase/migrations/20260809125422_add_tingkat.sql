-- Add tingkat (grade level 3-9) to mapel, kelas, siswa_detail

-- Add tingkat to mapel
alter table mapel add column tingkat smallint;

-- Add tingkat to kelas  
alter table kelas add column tingkat smallint;

-- Add tingkat to siswa_detail (for privat students)
alter table siswa_detail add column tingkat smallint;

-- Add constraints after ensuring existing data can be handled
-- These should be set to NOT NULL after migrating existing data
