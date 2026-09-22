-- Skema kanonik Pena untuk PostgreSQL mandiri.
--
-- Dihasilkan dengan pg_dump dari database yang sudah jalan, bukan ditulis
-- tangan, supaya persis sama dengan yang dipakai. Menyusunnya ulang:
--
--   createdb pena
--   psql -d pena -f db/schema.sql
--
-- Migration lama di supabase/migrations/ disimpan sebagai riwayat, bukan lagi
-- sumber kebenaran. Tiga di antaranya (bucket storage) tidak ikut ke sini:
-- berkas sekarang di disk, dan seluruh RLS memang hanya ada di file-file itu.
--
-- app_users dan sessions menggantikan auth.users milik Supabase.
--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: close_sesi(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.close_sesi(p_sesi_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: attempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attempt (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    siswa_detail_id uuid NOT NULL,
    try_out_id uuid,
    sub_materi_id uuid,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    nilai integer,
    is_active boolean DEFAULT true NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT attempt_check CHECK ((num_nonnulls(try_out_id, sub_materi_id) = 1)),
    CONSTRAINT attempt_nilai_check CHECK (((nilai >= 0) AND (nilai <= 100)))
);


--
-- Name: jawaban_siswa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jawaban_siswa (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid NOT NULL,
    soal_id uuid NOT NULL,
    pilihan_jawaban_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: jurnal_mengajar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jurnal_mengajar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sesi_id uuid NOT NULL,
    materi_id uuid NOT NULL,
    deskripsi text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    submitted_at timestamp with time zone,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT jurnal_mengajar_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text])))
);


--
-- Name: kelas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kelas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nama text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: kpi_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bobot_gain integer DEFAULT 60 NOT NULL,
    bobot_jurnal integer DEFAULT 40 NOT NULL,
    periode text DEFAULT 'bulanan'::text NOT NULL,
    valid_from date NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT kpi_config_check CHECK (((bobot_gain + bobot_jurnal) = 100)),
    CONSTRAINT kpi_config_periode_check CHECK ((periode = ANY (ARRAY['bulanan'::text, 'semesteran'::text])))
);


--
-- Name: kpi_snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tentor_id uuid NOT NULL,
    periode_mulai date NOT NULL,
    periode_selesai date NOT NULL,
    nilai_gain numeric(5,2),
    nilai_jurnal numeric(5,2),
    skor numeric(5,2) NOT NULL,
    jumlah_siswa_dinilai integer NOT NULL,
    jumlah_sesi integer NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: mapel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mapel (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nama text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: mapel_kelas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mapel_kelas (
    mapel_id uuid NOT NULL,
    kelas_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: materi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mapel_id uuid NOT NULL,
    nama text NOT NULL,
    nomor_urut smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: module; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sub_materi_id uuid NOT NULL,
    status text NOT NULL,
    storage_path text NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT module_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text]))),
    CONSTRAINT published_needs_timestamp CHECK (((status = 'published'::text) = (published_at IS NOT NULL)))
);


--
-- Name: nilai_manual; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nilai_manual (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    siswa_detail_id uuid NOT NULL,
    mapel_id uuid NOT NULL,
    materi_id uuid,
    tipe_test text NOT NULL,
    judul text NOT NULL,
    tanggal date NOT NULL,
    nilai integer NOT NULL,
    catatan text,
    tentor_id uuid NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT nilai_manual_nilai_check CHECK (((nilai >= 0) AND (nilai <= 100))),
    CONSTRAINT nilai_manual_tipe_test_check CHECK ((tipe_test = ANY (ARRAY['pre_test'::text, 'try_out'::text, 'post_test'::text])))
);


--
-- Name: pilihan_jawaban; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pilihan_jawaban (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    soal_id uuid NOT NULL,
    teks text NOT NULL,
    is_benar boolean DEFAULT false NOT NULL,
    nomor_urut integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: presensi_murid; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presensi_murid (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sesi_id uuid NOT NULL,
    siswa_detail_id uuid NOT NULL,
    is_hadir boolean NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    role text NOT NULL,
    nama_lengkap text NOT NULL,
    email text NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['kepala_guru'::text, 'tentor'::text, 'siswa'::text, 'wali_murid'::text])))
);


--
-- Name: relief; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relief (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tentor_asli_id uuid NOT NULL,
    pengganti_id uuid NOT NULL,
    kelas_id uuid NOT NULL,
    mapel_id uuid NOT NULL,
    tanggal date NOT NULL,
    task text NOT NULL,
    status text DEFAULT 'aktif'::text NOT NULL,
    email_error text,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT relief_check CHECK ((tentor_asli_id <> pengganti_id)),
    CONSTRAINT relief_status_check CHECK ((status = ANY (ARRAY['aktif'::text, 'dibatalkan'::text])))
);


--
-- Name: sesi_mengajar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sesi_mengajar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tentor_id uuid NOT NULL,
    kelas_id uuid NOT NULL,
    mapel_id uuid NOT NULL,
    foto_path text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    status text DEFAULT 'open'::text NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT sesi_mengajar_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    token text NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: siswa_detail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.siswa_detail (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    paket text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT siswa_detail_paket_check CHECK ((paket = ANY (ARRAY['regular'::text, 'privat'::text])))
);


--
-- Name: siswa_kelas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.siswa_kelas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    siswa_detail_id uuid NOT NULL,
    kelas_id uuid NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: soal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.soal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sub_materi_id uuid,
    pertanyaan text NOT NULL,
    nomor_urut integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    try_out_id uuid,
    CONSTRAINT soal_satu_induk CHECK ((num_nonnulls(sub_materi_id, try_out_id) = 1))
);


--
-- Name: sub_materi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_materi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    materi_id uuid NOT NULL,
    nama text NOT NULL,
    nomor_urut smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: tahun_ajaran; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tahun_ajaran (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nama text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: tentor_kelas_mapel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tentor_kelas_mapel (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tentor_id uuid NOT NULL,
    kelas_id uuid NOT NULL,
    mapel_id uuid NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: tentor_siswa_privat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tentor_siswa_privat (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    siswa_detail_id uuid NOT NULL,
    tentor_id uuid NOT NULL,
    mapel_id uuid NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: try_out; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.try_out (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    materi_id uuid NOT NULL,
    judul text NOT NULL,
    tipe_test text NOT NULL,
    waktu_buka timestamp with time zone NOT NULL,
    durasi_menit integer NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    tahun_ajaran_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT try_out_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text]))),
    CONSTRAINT try_out_tipe_test_check CHECK ((tipe_test = ANY (ARRAY['biasa'::text, 'pre_test'::text, 'post_test'::text])))
);


--
-- Name: try_out_kelas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.try_out_kelas (
    try_out_id uuid NOT NULL,
    kelas_id uuid NOT NULL
);


--
-- Name: wali_siswa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wali_siswa (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wali_id uuid NOT NULL,
    siswa_detail_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: app_users app_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT app_users_pkey PRIMARY KEY (id);


--
-- Name: attempt attempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attempt
    ADD CONSTRAINT attempt_pkey PRIMARY KEY (id);


--
-- Name: jawaban_siswa jawaban_siswa_attempt_id_soal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jawaban_siswa
    ADD CONSTRAINT jawaban_siswa_attempt_id_soal_id_key UNIQUE (attempt_id, soal_id);


--
-- Name: jawaban_siswa jawaban_siswa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jawaban_siswa
    ADD CONSTRAINT jawaban_siswa_pkey PRIMARY KEY (id);


--
-- Name: jurnal_mengajar jurnal_mengajar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurnal_mengajar
    ADD CONSTRAINT jurnal_mengajar_pkey PRIMARY KEY (id);


--
-- Name: jurnal_mengajar jurnal_mengajar_sesi_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurnal_mengajar
    ADD CONSTRAINT jurnal_mengajar_sesi_id_key UNIQUE (sesi_id);


--
-- Name: kelas kelas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kelas
    ADD CONSTRAINT kelas_pkey PRIMARY KEY (id);


--
-- Name: kpi_config kpi_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_config
    ADD CONSTRAINT kpi_config_pkey PRIMARY KEY (id);


--
-- Name: kpi_snapshot kpi_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_snapshot
    ADD CONSTRAINT kpi_snapshot_pkey PRIMARY KEY (id);


--
-- Name: kpi_snapshot kpi_snapshot_tentor_id_periode_mulai_tahun_ajaran_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_snapshot
    ADD CONSTRAINT kpi_snapshot_tentor_id_periode_mulai_tahun_ajaran_id_key UNIQUE (tentor_id, periode_mulai, tahun_ajaran_id);


--
-- Name: mapel_kelas mapel_kelas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mapel_kelas
    ADD CONSTRAINT mapel_kelas_pkey PRIMARY KEY (mapel_id, kelas_id);


--
-- Name: mapel mapel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mapel
    ADD CONSTRAINT mapel_pkey PRIMARY KEY (id);


--
-- Name: materi materi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materi
    ADD CONSTRAINT materi_pkey PRIMARY KEY (id);


--
-- Name: module module_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module
    ADD CONSTRAINT module_pkey PRIMARY KEY (id);


--
-- Name: module module_sub_materi_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module
    ADD CONSTRAINT module_sub_materi_id_key UNIQUE (sub_materi_id);


--
-- Name: nilai_manual nilai_manual_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nilai_manual
    ADD CONSTRAINT nilai_manual_pkey PRIMARY KEY (id);


--
-- Name: pilihan_jawaban pilihan_jawaban_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilihan_jawaban
    ADD CONSTRAINT pilihan_jawaban_pkey PRIMARY KEY (id);


--
-- Name: presensi_murid presensi_murid_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presensi_murid
    ADD CONSTRAINT presensi_murid_pkey PRIMARY KEY (id);


--
-- Name: presensi_murid presensi_murid_sesi_id_siswa_detail_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presensi_murid
    ADD CONSTRAINT presensi_murid_sesi_id_siswa_detail_id_key UNIQUE (sesi_id, siswa_detail_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: relief relief_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relief
    ADD CONSTRAINT relief_pkey PRIMARY KEY (id);


--
-- Name: sesi_mengajar sesi_mengajar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesi_mengajar
    ADD CONSTRAINT sesi_mengajar_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (token);


--
-- Name: siswa_detail siswa_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa_detail
    ADD CONSTRAINT siswa_detail_pkey PRIMARY KEY (id);


--
-- Name: siswa_kelas siswa_kelas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa_kelas
    ADD CONSTRAINT siswa_kelas_pkey PRIMARY KEY (id);


--
-- Name: siswa_kelas siswa_kelas_siswa_detail_id_kelas_id_tahun_ajaran_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa_kelas
    ADD CONSTRAINT siswa_kelas_siswa_detail_id_kelas_id_tahun_ajaran_id_key UNIQUE (siswa_detail_id, kelas_id, tahun_ajaran_id);


--
-- Name: soal soal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soal
    ADD CONSTRAINT soal_pkey PRIMARY KEY (id);


--
-- Name: sub_materi sub_materi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_materi
    ADD CONSTRAINT sub_materi_pkey PRIMARY KEY (id);


--
-- Name: tahun_ajaran tahun_ajaran_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tahun_ajaran
    ADD CONSTRAINT tahun_ajaran_pkey PRIMARY KEY (id);


--
-- Name: tentor_kelas_mapel tentor_kelas_mapel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_kelas_mapel
    ADD CONSTRAINT tentor_kelas_mapel_pkey PRIMARY KEY (id);


--
-- Name: tentor_kelas_mapel tentor_kelas_mapel_tentor_id_kelas_id_mapel_id_tahun_ajaran_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_kelas_mapel
    ADD CONSTRAINT tentor_kelas_mapel_tentor_id_kelas_id_mapel_id_tahun_ajaran_key UNIQUE (tentor_id, kelas_id, mapel_id, tahun_ajaran_id);


--
-- Name: tentor_siswa_privat tentor_siswa_privat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_siswa_privat
    ADD CONSTRAINT tentor_siswa_privat_pkey PRIMARY KEY (id);


--
-- Name: tentor_siswa_privat tentor_siswa_privat_siswa_detail_id_tentor_id_mapel_id_tahu_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_siswa_privat
    ADD CONSTRAINT tentor_siswa_privat_siswa_detail_id_tentor_id_mapel_id_tahu_key UNIQUE (siswa_detail_id, tentor_id, mapel_id, tahun_ajaran_id);


--
-- Name: try_out_kelas try_out_kelas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_out_kelas
    ADD CONSTRAINT try_out_kelas_pkey PRIMARY KEY (try_out_id, kelas_id);


--
-- Name: try_out try_out_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_out
    ADD CONSTRAINT try_out_pkey PRIMARY KEY (id);


--
-- Name: wali_siswa wali_siswa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_siswa
    ADD CONSTRAINT wali_siswa_pkey PRIMARY KEY (id);


--
-- Name: wali_siswa wali_siswa_wali_id_siswa_detail_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_siswa
    ADD CONSTRAINT wali_siswa_wali_id_siswa_detail_id_key UNIQUE (wali_id, siswa_detail_id);


--
-- Name: idx_app_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_app_users_email ON public.app_users USING btree (lower(email));


--
-- Name: idx_attempt_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempt_is_active ON public.attempt USING btree (is_active) WHERE (deleted_at IS NULL);


--
-- Name: idx_attempt_siswa_detail; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempt_siswa_detail ON public.attempt USING btree (siswa_detail_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_attempt_sub_materi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempt_sub_materi ON public.attempt USING btree (sub_materi_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_attempt_tahun_ajaran; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempt_tahun_ajaran ON public.attempt USING btree (tahun_ajaran_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_attempt_try_out; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempt_try_out ON public.attempt USING btree (try_out_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_jawaban_siswa_attempt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jawaban_siswa_attempt ON public.jawaban_siswa USING btree (attempt_id);


--
-- Name: idx_jawaban_siswa_soal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jawaban_siswa_soal ON public.jawaban_siswa USING btree (soal_id);


--
-- Name: idx_jurnal_materi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jurnal_materi ON public.jurnal_mengajar USING btree (materi_id);


--
-- Name: idx_jurnal_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jurnal_status ON public.jurnal_mengajar USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_jurnal_tahun_ajaran; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jurnal_tahun_ajaran ON public.jurnal_mengajar USING btree (tahun_ajaran_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_kpi_config_berlaku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_config_berlaku ON public.kpi_config USING btree (tahun_ajaran_id, valid_from DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_kpi_snapshot_periode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_snapshot_periode ON public.kpi_snapshot USING btree (tahun_ajaran_id, periode_mulai DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_kpi_snapshot_tentor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_snapshot_tentor ON public.kpi_snapshot USING btree (tentor_id, periode_mulai DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_mapel_kelas_kelas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mapel_kelas_kelas ON public.mapel_kelas USING btree (kelas_id);


--
-- Name: idx_materi_mapel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materi_mapel ON public.materi USING btree (mapel_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_module_sub_materi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_module_sub_materi ON public.module USING btree (sub_materi_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_nilai_manual_mapel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nilai_manual_mapel ON public.nilai_manual USING btree (mapel_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_nilai_manual_siswa_detail; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nilai_manual_siswa_detail ON public.nilai_manual USING btree (siswa_detail_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_nilai_manual_tahun_ajaran; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nilai_manual_tahun_ajaran ON public.nilai_manual USING btree (tahun_ajaran_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_nilai_manual_tentor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nilai_manual_tentor ON public.nilai_manual USING btree (tentor_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_pilihan_jawaban_soal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pilihan_jawaban_soal_id ON public.pilihan_jawaban USING btree (soal_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_presensi_sesi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presensi_sesi ON public.presensi_murid USING btree (sesi_id);


--
-- Name: idx_presensi_siswa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presensi_siswa ON public.presensi_murid USING btree (siswa_detail_id);


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role) WHERE (deleted_at IS NULL);


--
-- Name: idx_profiles_tahun_ajaran; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_tahun_ajaran ON public.profiles USING btree (tahun_ajaran_id);


--
-- Name: idx_relief_asli; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_relief_asli ON public.relief USING btree (tentor_asli_id);


--
-- Name: idx_relief_pengganti; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_relief_pengganti ON public.relief USING btree (pengganti_id, tanggal) WHERE ((status = 'aktif'::text) AND (deleted_at IS NULL));


--
-- Name: idx_relief_tanggal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_relief_tanggal ON public.relief USING btree (tanggal) WHERE (deleted_at IS NULL);


--
-- Name: idx_relief_unik; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_relief_unik ON public.relief USING btree (tentor_asli_id, kelas_id, mapel_id, tanggal) WHERE ((status = 'aktif'::text) AND (deleted_at IS NULL));


--
-- Name: idx_sesi_kelas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sesi_kelas ON public.sesi_mengajar USING btree (kelas_id);


--
-- Name: idx_sesi_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sesi_status ON public.sesi_mengajar USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_sesi_tahun_ajaran; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sesi_tahun_ajaran ON public.sesi_mengajar USING btree (tahun_ajaran_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_sesi_tentor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sesi_tentor ON public.sesi_mengajar USING btree (tentor_id);


--
-- Name: idx_sessions_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expires ON public.sessions USING btree (expires_at);


--
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user ON public.sessions USING btree (user_id);


--
-- Name: idx_siswa_detail_paket; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_siswa_detail_paket ON public.siswa_detail USING btree (paket) WHERE (deleted_at IS NULL);


--
-- Name: idx_siswa_detail_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_siswa_detail_profile ON public.siswa_detail USING btree (profile_id);


--
-- Name: idx_siswa_kelas_kelas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_siswa_kelas_kelas ON public.siswa_kelas USING btree (kelas_id);


--
-- Name: idx_siswa_kelas_tahun; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_siswa_kelas_tahun ON public.siswa_kelas USING btree (tahun_ajaran_id);


--
-- Name: idx_soal_sub_materi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_soal_sub_materi_id ON public.soal USING btree (sub_materi_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_soal_try_out_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_soal_try_out_id ON public.soal USING btree (try_out_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_sub_materi_materi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sub_materi_materi ON public.sub_materi USING btree (materi_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_tahun_ajaran_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tahun_ajaran_active ON public.tahun_ajaran USING btree (is_active) WHERE ((is_active = true) AND (deleted_at IS NULL));


--
-- Name: idx_tkm_kelas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tkm_kelas ON public.tentor_kelas_mapel USING btree (kelas_id);


--
-- Name: idx_tkm_mapel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tkm_mapel ON public.tentor_kelas_mapel USING btree (mapel_id);


--
-- Name: idx_tkm_tentor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tkm_tentor ON public.tentor_kelas_mapel USING btree (tentor_id);


--
-- Name: idx_try_out_kelas_kelas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_try_out_kelas_kelas ON public.try_out_kelas USING btree (kelas_id);


--
-- Name: idx_try_out_materi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_try_out_materi ON public.try_out USING btree (materi_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_try_out_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_try_out_status ON public.try_out USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_try_out_tahun_ajaran; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_try_out_tahun_ajaran ON public.try_out USING btree (tahun_ajaran_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_tsp_siswa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tsp_siswa ON public.tentor_siswa_privat USING btree (siswa_detail_id);


--
-- Name: idx_tsp_tentor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tsp_tentor ON public.tentor_siswa_privat USING btree (tentor_id);


--
-- Name: idx_unique_materi_per_mapel; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unique_materi_per_mapel ON public.materi USING btree (mapel_id, nomor_urut) WHERE (deleted_at IS NULL);


--
-- Name: idx_unique_sub_materi_per_materi; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unique_sub_materi_per_materi ON public.sub_materi USING btree (materi_id, nomor_urut) WHERE (deleted_at IS NULL);


--
-- Name: idx_wali_siswa_siswa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wali_siswa_siswa ON public.wali_siswa USING btree (siswa_detail_id);


--
-- Name: idx_wali_siswa_wali; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wali_siswa_wali ON public.wali_siswa USING btree (wali_id);


--
-- Name: attempt attempt_siswa_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attempt
    ADD CONSTRAINT attempt_siswa_detail_id_fkey FOREIGN KEY (siswa_detail_id) REFERENCES public.siswa_detail(id);


--
-- Name: attempt attempt_sub_materi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attempt
    ADD CONSTRAINT attempt_sub_materi_id_fkey FOREIGN KEY (sub_materi_id) REFERENCES public.sub_materi(id);


--
-- Name: attempt attempt_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attempt
    ADD CONSTRAINT attempt_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: attempt attempt_try_out_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attempt
    ADD CONSTRAINT attempt_try_out_id_fkey FOREIGN KEY (try_out_id) REFERENCES public.try_out(id);


--
-- Name: jawaban_siswa jawaban_siswa_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jawaban_siswa
    ADD CONSTRAINT jawaban_siswa_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.attempt(id);


--
-- Name: jawaban_siswa jawaban_siswa_pilihan_jawaban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jawaban_siswa
    ADD CONSTRAINT jawaban_siswa_pilihan_jawaban_id_fkey FOREIGN KEY (pilihan_jawaban_id) REFERENCES public.pilihan_jawaban(id);


--
-- Name: jawaban_siswa jawaban_siswa_soal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jawaban_siswa
    ADD CONSTRAINT jawaban_siswa_soal_id_fkey FOREIGN KEY (soal_id) REFERENCES public.soal(id);


--
-- Name: jurnal_mengajar jurnal_mengajar_materi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurnal_mengajar
    ADD CONSTRAINT jurnal_mengajar_materi_id_fkey FOREIGN KEY (materi_id) REFERENCES public.materi(id);


--
-- Name: jurnal_mengajar jurnal_mengajar_sesi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurnal_mengajar
    ADD CONSTRAINT jurnal_mengajar_sesi_id_fkey FOREIGN KEY (sesi_id) REFERENCES public.sesi_mengajar(id);


--
-- Name: jurnal_mengajar jurnal_mengajar_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurnal_mengajar
    ADD CONSTRAINT jurnal_mengajar_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: kpi_config kpi_config_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_config
    ADD CONSTRAINT kpi_config_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: kpi_snapshot kpi_snapshot_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_snapshot
    ADD CONSTRAINT kpi_snapshot_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: kpi_snapshot kpi_snapshot_tentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_snapshot
    ADD CONSTRAINT kpi_snapshot_tentor_id_fkey FOREIGN KEY (tentor_id) REFERENCES public.profiles(id);


--
-- Name: mapel_kelas mapel_kelas_kelas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mapel_kelas
    ADD CONSTRAINT mapel_kelas_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES public.kelas(id);


--
-- Name: mapel_kelas mapel_kelas_mapel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mapel_kelas
    ADD CONSTRAINT mapel_kelas_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES public.mapel(id);


--
-- Name: materi materi_mapel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materi
    ADD CONSTRAINT materi_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES public.mapel(id);


--
-- Name: module module_sub_materi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module
    ADD CONSTRAINT module_sub_materi_id_fkey FOREIGN KEY (sub_materi_id) REFERENCES public.sub_materi(id);


--
-- Name: nilai_manual nilai_manual_mapel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nilai_manual
    ADD CONSTRAINT nilai_manual_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES public.mapel(id);


--
-- Name: nilai_manual nilai_manual_materi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nilai_manual
    ADD CONSTRAINT nilai_manual_materi_id_fkey FOREIGN KEY (materi_id) REFERENCES public.materi(id);


--
-- Name: nilai_manual nilai_manual_siswa_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nilai_manual
    ADD CONSTRAINT nilai_manual_siswa_detail_id_fkey FOREIGN KEY (siswa_detail_id) REFERENCES public.siswa_detail(id);


--
-- Name: nilai_manual nilai_manual_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nilai_manual
    ADD CONSTRAINT nilai_manual_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: nilai_manual nilai_manual_tentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nilai_manual
    ADD CONSTRAINT nilai_manual_tentor_id_fkey FOREIGN KEY (tentor_id) REFERENCES public.profiles(id);


--
-- Name: pilihan_jawaban pilihan_jawaban_soal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilihan_jawaban
    ADD CONSTRAINT pilihan_jawaban_soal_id_fkey FOREIGN KEY (soal_id) REFERENCES public.soal(id);


--
-- Name: presensi_murid presensi_murid_sesi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presensi_murid
    ADD CONSTRAINT presensi_murid_sesi_id_fkey FOREIGN KEY (sesi_id) REFERENCES public.sesi_mengajar(id);


--
-- Name: presensi_murid presensi_murid_siswa_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presensi_murid
    ADD CONSTRAINT presensi_murid_siswa_detail_id_fkey FOREIGN KEY (siswa_detail_id) REFERENCES public.siswa_detail(id);


--
-- Name: presensi_murid presensi_murid_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presensi_murid
    ADD CONSTRAINT presensi_murid_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.app_users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: relief relief_kelas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relief
    ADD CONSTRAINT relief_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES public.kelas(id);


--
-- Name: relief relief_mapel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relief
    ADD CONSTRAINT relief_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES public.mapel(id);


--
-- Name: relief relief_pengganti_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relief
    ADD CONSTRAINT relief_pengganti_id_fkey FOREIGN KEY (pengganti_id) REFERENCES public.profiles(id);


--
-- Name: relief relief_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relief
    ADD CONSTRAINT relief_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: relief relief_tentor_asli_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relief
    ADD CONSTRAINT relief_tentor_asli_id_fkey FOREIGN KEY (tentor_asli_id) REFERENCES public.profiles(id);


--
-- Name: sesi_mengajar sesi_mengajar_kelas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesi_mengajar
    ADD CONSTRAINT sesi_mengajar_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES public.kelas(id);


--
-- Name: sesi_mengajar sesi_mengajar_mapel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesi_mengajar
    ADD CONSTRAINT sesi_mengajar_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES public.mapel(id);


--
-- Name: sesi_mengajar sesi_mengajar_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesi_mengajar
    ADD CONSTRAINT sesi_mengajar_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: sesi_mengajar sesi_mengajar_tentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesi_mengajar
    ADD CONSTRAINT sesi_mengajar_tentor_id_fkey FOREIGN KEY (tentor_id) REFERENCES public.profiles(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;


--
-- Name: siswa_detail siswa_detail_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa_detail
    ADD CONSTRAINT siswa_detail_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);


--
-- Name: siswa_kelas siswa_kelas_kelas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa_kelas
    ADD CONSTRAINT siswa_kelas_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES public.kelas(id);


--
-- Name: siswa_kelas siswa_kelas_siswa_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa_kelas
    ADD CONSTRAINT siswa_kelas_siswa_detail_id_fkey FOREIGN KEY (siswa_detail_id) REFERENCES public.siswa_detail(id);


--
-- Name: siswa_kelas siswa_kelas_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa_kelas
    ADD CONSTRAINT siswa_kelas_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: soal soal_sub_materi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soal
    ADD CONSTRAINT soal_sub_materi_id_fkey FOREIGN KEY (sub_materi_id) REFERENCES public.sub_materi(id);


--
-- Name: soal soal_try_out_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soal
    ADD CONSTRAINT soal_try_out_id_fkey FOREIGN KEY (try_out_id) REFERENCES public.try_out(id);


--
-- Name: sub_materi sub_materi_materi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_materi
    ADD CONSTRAINT sub_materi_materi_id_fkey FOREIGN KEY (materi_id) REFERENCES public.materi(id);


--
-- Name: tentor_kelas_mapel tentor_kelas_mapel_kelas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_kelas_mapel
    ADD CONSTRAINT tentor_kelas_mapel_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES public.kelas(id);


--
-- Name: tentor_kelas_mapel tentor_kelas_mapel_mapel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_kelas_mapel
    ADD CONSTRAINT tentor_kelas_mapel_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES public.mapel(id);


--
-- Name: tentor_kelas_mapel tentor_kelas_mapel_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_kelas_mapel
    ADD CONSTRAINT tentor_kelas_mapel_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: tentor_kelas_mapel tentor_kelas_mapel_tentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_kelas_mapel
    ADD CONSTRAINT tentor_kelas_mapel_tentor_id_fkey FOREIGN KEY (tentor_id) REFERENCES public.profiles(id);


--
-- Name: tentor_siswa_privat tentor_siswa_privat_mapel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_siswa_privat
    ADD CONSTRAINT tentor_siswa_privat_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES public.mapel(id);


--
-- Name: tentor_siswa_privat tentor_siswa_privat_siswa_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_siswa_privat
    ADD CONSTRAINT tentor_siswa_privat_siswa_detail_id_fkey FOREIGN KEY (siswa_detail_id) REFERENCES public.siswa_detail(id);


--
-- Name: tentor_siswa_privat tentor_siswa_privat_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_siswa_privat
    ADD CONSTRAINT tentor_siswa_privat_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: tentor_siswa_privat tentor_siswa_privat_tentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentor_siswa_privat
    ADD CONSTRAINT tentor_siswa_privat_tentor_id_fkey FOREIGN KEY (tentor_id) REFERENCES public.profiles(id);


--
-- Name: try_out_kelas try_out_kelas_kelas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_out_kelas
    ADD CONSTRAINT try_out_kelas_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES public.kelas(id);


--
-- Name: try_out_kelas try_out_kelas_try_out_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_out_kelas
    ADD CONSTRAINT try_out_kelas_try_out_id_fkey FOREIGN KEY (try_out_id) REFERENCES public.try_out(id);


--
-- Name: try_out try_out_materi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_out
    ADD CONSTRAINT try_out_materi_id_fkey FOREIGN KEY (materi_id) REFERENCES public.materi(id);


--
-- Name: try_out try_out_tahun_ajaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_out
    ADD CONSTRAINT try_out_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: wali_siswa wali_siswa_siswa_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_siswa
    ADD CONSTRAINT wali_siswa_siswa_detail_id_fkey FOREIGN KEY (siswa_detail_id) REFERENCES public.siswa_detail(id);


--
-- Name: wali_siswa wali_siswa_wali_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_siswa
    ADD CONSTRAINT wali_siswa_wali_id_fkey FOREIGN KEY (wali_id) REFERENCES public.profiles(id);


--
-- PostgreSQL database dump complete
--


