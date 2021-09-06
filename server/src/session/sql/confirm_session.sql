update sessions
   set user_id = $2
     , expire_at = $3
 where id = $1
returning id, expire_at, user_id, public_key, project_id