
insert into api_keys(token, user_id, expire_at, name)
values($1, $2, $3, $4)
returning id