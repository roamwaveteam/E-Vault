# Exam Vault

A searchable archive of Cameroon examination papers, organized by exam family, year, subject, department, and paper type.

## Development

```bash
npm install
cp .env.example .env.local
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
```

## Supabase

The connected project is **E-Vault** (`zbbyfyduavuovsfmqiac`, `eu-west-2`). The database now contains the Exam Vault schema:

- `exam_families` — GCE O/L, GCE A/L, HND, BTS, Probatoire, BEPC
- `departments` — normalized subjects and HND/BTS departments
- `paper_sources` — provenance, access state, and rights status
- `papers` — year/session/subject/paper metadata and source URLs

The initial seed is deliberately provenance-aware: public indexes and gated sources are stored as such, while only individually verified records are marked `verified_pdf` or `verified_page`.

The full 2010-onward archive is not yet complete because no public source verified a complete collection across every year, paper, and department. Continue ingestion by adding verified records to `supabase/migrations/20261005_seed_exam_vault.sql`.
