-- Your SQL goes here

create table if not exists templates
	( id uuid primary key default uuid_generate_v4() 
	, body text not null
	, name text not null
	, project_id uuid not null references projects(id) on delete cascade
	, unique (name, project_id)
	);

create table if not exists template_data
	( template_id uuid primary key references templates(id) on delete cascade
	, project_id uuid not null references projects(id) on delete cascade
	, redirect_to text not null
	, from_name text
	, subject text
	);

create table if not exists template_translations
	( project_id uuid not null references projects(id) on delete cascade
	, template_id uuid not null references templates(id) on delete cascade
	, language text not null default 'en'
	, content jsonb not null
	, primary key(template_id, language)
	);