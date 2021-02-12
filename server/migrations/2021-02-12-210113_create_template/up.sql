-- Your SQL goes here

create table if not exists templates
	( from_name text not null
	, subject text not null
	, body text not null
	, redirect_to text not null
	, of_type text not null
	, project_id uuid references projects(id) on delete cascade
	, primary key (of_type, project_id)
	);
