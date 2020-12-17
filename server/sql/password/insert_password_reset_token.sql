insert into password_change_requests (token, user_id)
values ($1, $2)
returning id