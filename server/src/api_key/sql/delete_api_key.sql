
delete from api_keys
 where id = $1
   and project_id = $2
   and user_id = $3
