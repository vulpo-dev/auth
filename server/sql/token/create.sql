insert into tokens (user_id, expire, project_id)
values ($1, $2, $3)
returning id