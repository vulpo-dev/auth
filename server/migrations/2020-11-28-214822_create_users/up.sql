-- Your SQL goes here

create table if not exists users
	( id uuid primary key default uuid_generate_v4()
	, display_name text
	, password text
	, email text not null
	, email_verified boolean not null default false
	, photo_url text
	, traits text[] not null default '{}'
	, data jsonb not null default '{}'::jsonb
	, provider_id text not null
	, created_at timestamptz not null default now()
	, updated_at timestamptz not null default now()
	, project_id uuid references projects(id) on delete cascade
	, disabled boolean not null default false
	, unique(project_id, email)
	);

create index user_email_idx on users using btree(email);
create index user_created_at_idx on users using btree(created_at);
create index user_project_idx on users using btree(project_id);

create index user_traits_idx on users using gin(traits);
create index user_data_idx on users using gin(data);

select diesel_manage_updated_at('users');