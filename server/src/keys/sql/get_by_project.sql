select project_id as id
     , public_key as key
  from project_keys
 where project_id = $1 