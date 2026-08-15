-- Landas backend schema
-- Run this once against your Postgres database (e.g. `psql -f schema.sql`,
-- or paste into Supabase's SQL editor if you're reusing a Supabase Postgres
-- instance purely as a database, with the backend talking to it directly).

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('teacher','student')),
  created_at timestamptz not null default now()
);

create table if not exists teacher_profiles (
  id uuid primary key references users(id) on delete cascade,
  name text not null,
  school text not null,
  grade text not null
);

create table if not exists students (
  id uuid primary key references users(id) on delete cascade,
  name text not null,
  age int not null,
  school text not null,
  grade text not null,
  section text not null,
  style text check (style in ('V','A','R','K')),
  confidence int,
  completed_at timestamptz
);

create index if not exists idx_students_school_grade on students(school, grade);
