# E-Vault

Student learning site built with React, Vite, and Supabase.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local` using the Supabase project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Useful commands:

```bash
npm run lint
npm run build
```

## Backend

The connected Supabase project is **E-Vault** (`zbbyfyduavuovsfmqiac`, `eu-west-2`). It is healthy and currently has no application tables or migrations. The `supabase/migrations` directory is ready for the first schema migration once the first user story is defined.
