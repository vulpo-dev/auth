-- Your SQL goes here

create table if not exists tokens
	( id uuid primary key
	, session_id uuid not null references sessions(id) on delete cascade
	, expire_at timestamp not null
	);