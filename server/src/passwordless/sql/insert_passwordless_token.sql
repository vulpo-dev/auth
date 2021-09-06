insert into passwordless (user_id, email, token, project_id, session_id)
values ($1, $2, $3, $4, $5)
returning id