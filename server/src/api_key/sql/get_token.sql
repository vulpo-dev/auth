
select api_keys.token
     , api_keys.expire_at
  from api_keys
 where id = $1
