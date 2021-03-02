
with delete_user_token as (
	delete from token_user
	 where user_id = $1
	returning token_id
), get_token_id as (
	select token_user.token_id
		 , count(token_user.user_id)
      from delete_user_token
      join token_user on token_user.token_id = delete_user_token.token_id
     group by token_user.token_id 
     limit 2
)
delete from tokens
where tokens.id in (
	select get_token_id.token_id
	  from get_token_id
	 where count = 1
)