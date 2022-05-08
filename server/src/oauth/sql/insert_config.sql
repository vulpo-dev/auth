
insert into oauth(project_id, provider, settings)
values($1, $2, $3)
on conflict (project_id, provider)
	do update set settings = $3