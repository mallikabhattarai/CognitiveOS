# CognitiveOS

Protect and optimize your cognitive performance through sleep intelligence.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Copy `.env.example` to `.env.local`
   - Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Run the migration in Supabase SQL Editor: `supabase/migrations/20250216000000_initial_schema.sql`

3. **Run the app**

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) — the app uses a mobile-first layout (max 428px on desktop).

## Design & Implementation

- [Design doc](../../docs/plans/2025-02-16-cognitiveos-mvp-design.md)
- [Implementation plan](../../docs/plans/2025-02-16-cognitiveos-mvp-implementation.md)
