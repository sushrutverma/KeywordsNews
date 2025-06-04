/*
  # Create profiles table and auth schema

  1. New Tables
    - `public.profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `article_duration_filter` (interval, default 7 days)

  2. Security
    - Enable RLS on profiles table
    - Add policies for authenticated users
*/

create table if not exists public.profiles (
  id uuid references auth.users primary key,
  email text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  article_duration_filter interval default '7 days'
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Trigger to create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();