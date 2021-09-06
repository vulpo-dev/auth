update users
   set disabled = false
 where id = $1
   and project_id = $2