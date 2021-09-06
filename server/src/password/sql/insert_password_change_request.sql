insert into password_change_requests (token, user_id, project_id)
values ($1, $2, $3)
returning id