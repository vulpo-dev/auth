

delete from users
 where id in (
 	select token_user.user_id as id
	  from token_user
	 where token_user.token_id = $1
)