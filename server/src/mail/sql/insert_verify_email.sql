insert into verify_email (token, user_id, project_id)
values ($1, $2, $3)
returning id