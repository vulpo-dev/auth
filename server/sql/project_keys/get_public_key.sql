
select public_key
  from project_keys
 where project_id = $1
   and is_active = true