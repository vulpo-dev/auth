
create table if not exists project_settings (
	project_id uuid primary key references projects(id),
	email jsonb
);