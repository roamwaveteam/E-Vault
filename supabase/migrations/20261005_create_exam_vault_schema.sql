create extension if not exists pgcrypto;

create table public.exam_families (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  authority text,
  description text,
  created_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  exam_family_id uuid not null references public.exam_families(id) on delete cascade,
  code text,
  name text not null,
  stream text,
  created_at timestamptz not null default now(),
  unique (exam_family_id, name)
);

create table public.paper_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  url text not null,
  source_type text not null check (source_type in ('official','public_index','direct_pdf','third_party_portal','commercial','viewer','app')),
  years_claimed text,
  access_notes text,
  rights_status text not null default 'unknown' check (rights_status in ('unknown','official_publication','permission_required','open_license','restricted')),
  verified_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.papers (
  id uuid primary key default gen_random_uuid(),
  exam_family_id uuid not null references public.exam_families(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  source_id uuid references public.paper_sources(id) on delete set null,
  year smallint not null check (year between 1900 and 2100),
  session text not null default 'main',
  series text not null default '',
  subject text not null,
  paper_number text not null default '',
  title text not null,
  paper_type text not null default 'question' check (paper_type in ('question','correction','marking_guide','schedule','results','syllabus','index')),
  language text not null default 'English',
  file_url text,
  availability text not null default 'indexed' check (availability in ('verified_pdf','verified_page','indexed','gated','unavailable')),
  verification_notes text,
  created_at timestamptz not null default now(),
  unique (exam_family_id, year, session, series, subject, paper_number, paper_type)
);

create index papers_year_idx on public.papers(year);
create index papers_family_idx on public.papers(exam_family_id);
create index papers_department_idx on public.papers(department_id);
create index papers_subject_idx on public.papers(subject);

alter table public.exam_families enable row level security;
alter table public.departments enable row level security;
alter table public.paper_sources enable row level security;
alter table public.papers enable row level security;

create policy "public can read exam families" on public.exam_families for select using (true);
create policy "public can read departments" on public.departments for select using (true);
create policy "public can read paper sources" on public.paper_sources for select using (true);
create policy "public can read papers" on public.papers for select using (true);
