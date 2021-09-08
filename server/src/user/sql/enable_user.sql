update users
   set state = 'Active'
 where id = $1
   and project_id = $2