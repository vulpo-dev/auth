
select id
	 , email
	 , email_verified
	 , provider_id
	 , created_at
	 , disabled
  from users
 where project_id = $1
 order by case when $2 = 'created_at' then users.created_at end :direction,
 		  case when $2 = 'email' then users.email end :direction
 offset $3
 limit $4