
select id
     , public_key
     , expire_at
     , user_id
  from sessions
 where id = $1 