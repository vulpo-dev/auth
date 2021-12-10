-- Your SQL goes here

create type password_alg as enum('bcrypt', 'argon2id', 'sha1', 'scrypt', 'pbkdf2', 'md5');

create table if not exists passwords
	( user_id uuid primary key references users(id) on delete cascade
	, alg password_alg not null default 'argon2id'
	, hash text not null
	, updated_at timestamptz not null default now()
	);

select diesel_manage_updated_at('passwords');
