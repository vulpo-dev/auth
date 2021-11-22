
delete from projects
 where id = $1
   and is_admin = false