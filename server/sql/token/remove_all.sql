

with delete_user_tokens as (
	delete from token_user
	 where user_id in (
	 	select token_user.user_id
		  from token_user
		 where token_user.token_id = $1
		   and token_user.user_id = $2
	)
	returning token_id
), token_user_count as (
	select delete_user_tokens.token_id
	     , count(token_user.user_id)
	  from delete_user_tokens
	  join token_user on token_user.token_id = delete_user_tokens.token_id
	 group by delete_user_tokens.token_id 
)
delete from tokens
where tokens.id in (
	select token_user_count.token_id
	  from token_user_count
	 where count = 1
)