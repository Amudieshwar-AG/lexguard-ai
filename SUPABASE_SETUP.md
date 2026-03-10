# Supabase Setup Guide — LexGuard AI

This guide walks you through creating and connecting a Supabase project so that
Login and Register work with a real database.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **"New project"**.
3. Fill in:
   - **Project name** → `lexguard-ai` (or any name you like)
   - **Database password** → choose a strong password and **save it**
   - **Region** → pick one closest to your users
4. Click **"Create new project"** and wait ~1 minute for it to provision.

---

## 2. Get Your API Keys

1. In your project dashboard, go to **Settings → API**.
2. Copy the following two values:

| Value | Where to find it |
|---|---|
| **Project URL** | `https://<your-project-id>.supabase.co` |
| **anon / public key** | Under "Project API keys → anon public" |

---

## 3. Add Keys to Your `.env` File

Open `.env` in the project root and fill in your values:

```env
VITE_SUPABASE_URL="https://<your-project-id>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-anon-public-key>"
VITE_SUPABASE_PROJECT_ID="<your-project-id>"
```

> ⚠️ Never commit `.env` to Git. It is already in `.gitignore`.

---

## 4. Enable Email Auth

1. In your Supabase dashboard go to **Authentication → Providers**.
2. Make sure **Email** provider is **enabled**.
3. For a hackathon / demo, **disable "Confirm email"** so users can log in immediately after registering:
   - **Authentication → Email → Confirm email** → toggle **OFF**
4. Click **Save**.

---

## 5. (Optional) Create a `profiles` Table

Supabase Auth stores `full_name`, `company`, and `role` in `auth.users.user_metadata` automatically (LexGuard already does this). But if you want to query user profiles from the database, run this SQL:

Go to **SQL Editor** in your dashboard and run:

```sql
-- Create profiles table
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  email      text,
  company    text,
  role       text check (role in ('Lawyer', 'Analyst', 'Investor')),
  created_at timestamptz default now()
);

-- Allow users to read/write only their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, company, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'company',
    coalesce(new.raw_user_meta_data ->> 'role', 'Lawyer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

After running this, every new registration will automatically create a row in `public.profiles`.

---

## 6. Verify the Connection

1. Run the dev server:
   ```bash
   npm run dev
   ```
2. Open **http://localhost:8080** (or whichever port Vite uses).
3. Go to `/register`, create a new account.
4. In your Supabase dashboard → **Authentication → Users**, you should see the new user appear.
5. Try logging in with the same credentials at `/login`.

---

## 7. Common Errors

| Error | Fix |
|---|---|
| `Invalid API key` | Double-check `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` |
| `Email not confirmed` | Disable "Confirm email" in Auth → Email settings |
| `Invalid login credentials` | The email/password don't match any registered user |
| `User already registered` | That email already exists — use Login instead |
| Blank page / no redirect | Make sure `.env` has no extra spaces or quotes around values |

---

## 8. Project File Reference

| File | Purpose |
|---|---|
| `src/integrations/supabase/client.ts` | Creates the Supabase client using env variables |
| `src/context/AuthContext.tsx` | All auth logic — login, register, logout via Supabase |
| `src/components/ProtectedRoute.tsx` | Redirects unauthenticated users to `/login` |
| `src/pages/Login.tsx` | Login UI |
| `src/pages/Register.tsx` | Register UI |
| `.env` | Your Supabase URL + anon key (never commit this) |
