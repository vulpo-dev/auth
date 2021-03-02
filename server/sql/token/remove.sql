
with delete_user_token as (
	delete from token_user
	 where token_id = $1
	   and user_id = $2
	returning token_id
)
delete from tokens
 where tokens.id = $1
   and 1 in (
   		select count(token_user.user_id)
   		  from delete_user_token
   		  join token_user on token_user.token_id = delete_user_token.token_id
   		 limit 2
   )