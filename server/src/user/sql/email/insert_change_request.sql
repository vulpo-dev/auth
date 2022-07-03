
insert into email_change_request(old_email, new_email, user_id, token, reset_token, project_id)
values($1, $2, $3, $4, $5, $6)
returning id
