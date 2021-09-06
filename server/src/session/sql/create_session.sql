insert into sessions(id, public_key, expire_at, user_id, project_id)
values($1, $2, $3, $4, $5)
on conflict(id)
   do update
         set id = uuid_generate_v4()
returning id, public_key, expire_at, user_id, project_id