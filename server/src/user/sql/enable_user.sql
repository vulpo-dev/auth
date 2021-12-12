update users
   set state = 'active'
 where id = $1
   and project_id = $2