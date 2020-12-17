-- Your SQL goes here

create table if not exists password_change_requests
	( id uuid primary key default uuid_generate_v4()
	, created_at timestamptz not null default now()
	, user_id uuid references users(id) on delete cascade
	, token text not null
    );