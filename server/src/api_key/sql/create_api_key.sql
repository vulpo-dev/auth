
insert into api_keys(token, user_id, expire_at, name, project_id)
values($1, $2, $3, $4, $5)
returning id