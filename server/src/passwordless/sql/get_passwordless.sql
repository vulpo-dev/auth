select id
     , created_at
     , user_id
     , email
     , token
     , is_valid
     , project_id
     , confirmed
     , expire_at
  from passwordless
 where id = $1