-- Your SQL goes here

create type email_change_state as enum('request', 'reject', 'accept', 'reset');

create table if not exists email_change_request
	( id uuid primary key default uuid_generate_v4()
	, old_email text not null
	, new_email text not null
	, user_id uuid not null references users(id) on delete cascade
	, token text not null
	, reset_token text not null
	, state email_change_state not null default 'request'
	, expire_at timestamptz not null default now() + '30 minutes'
	, created_at timestamptz not null default now()
	);