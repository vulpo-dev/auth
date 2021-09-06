delete from passwordless
 where email = $1
   and project_id = $2