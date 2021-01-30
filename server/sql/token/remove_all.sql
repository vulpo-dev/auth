
delete from token_user
 where user_id in (
 	select token_user.user_id
	  from token_user
	 where token_user.token_id = $1
	   and token_user.user_id = $2
)