create table if not exists verify_email
	( id uuid primary key default uuid_generate_v4()
	, created_at timestamptz not null default now()
	, user_id uuid not null references users(id) on delete cascade
	, token text not null
	, project_id uuid not null references projects(id) on delete cascade
	, expire_at timestamptz not null default now() + '30 minutes'
	);

create index verify_email_user_idx on verify_email(user_id);
