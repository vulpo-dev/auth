
select array_agg(token_user.user_id) as user_ids
	 , tokens.project_id
	 , tokens.expire
	 , tokens.id
  from tokens
  left join token_user on token_user.token_id = tokens.id
 where tokens.id = $1
 group by tokens.project_id
		, tokens.expire
		, tokens.id