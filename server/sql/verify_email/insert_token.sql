insert into verify_email (token, user_id)
values ($1, $2)
returning id