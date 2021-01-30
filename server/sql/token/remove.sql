
delete from token_user
 where token_id = $1
   and user_id = $2