select token
     , user_id
     , created_at
     , expire_at
  from password_change_requests
 where id = $1