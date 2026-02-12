-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create rooms table
create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  created_by uuid references auth.users on delete cascade not null
);

-- Create messages table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  room_id uuid references rooms on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null
);

-- Enable RLS
alter table rooms enable row level security;
alter table messages enable row level security;

-- Policies for rooms
create policy "Rooms are viewable by authenticated users." on rooms
  for select using (auth.uid() is not null);

create policy "Authenticated users can create rooms." on rooms
  for insert with check (auth.uid() is not null);

-- Policies for messages
create policy "Messages are viewable by authenticated users." on messages
  for select using (auth.uid() is not null);

create policy "Authenticated users can insert messages." on messages
  for insert with check (auth.uid() is not null);

-- Enable Realtime for messages table
alter publication supabase_realtime add table messages;
