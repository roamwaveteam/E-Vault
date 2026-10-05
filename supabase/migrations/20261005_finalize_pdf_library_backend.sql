alter table public.papers
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_papers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists papers_set_updated_at on public.papers;
create trigger papers_set_updated_at
before update on public.papers
for each row execute function public.set_papers_updated_at();

create or replace view public.downloadable_papers
with (security_invoker = true)
as
select
  p.id,
  p.exam_family_id,
  p.department_id,
  p.source_id,
  p.year,
  p.session,
  p.series,
  p.subject,
  p.paper_number,
  p.title,
  p.language,
  p.file_url,
  p.availability,
  p.updated_at
from public.papers p
where p.paper_type = 'question'
  and p.file_url is not null
  and p.file_url ~* '[.]pdf([?#].*)?$';

grant select on public.downloadable_papers to anon, authenticated;

create index if not exists papers_pdf_library_idx
on public.papers (year desc, subject)
where paper_type = 'question'
  and file_url is not null
  and file_url ~* '[.]pdf([?#].*)?$';
