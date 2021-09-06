select token
     , user_id
     , created_at
     , expire_at
  from verify_email
 where id = $1