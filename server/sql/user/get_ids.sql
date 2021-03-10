
select id
	 , display_name
	 , email
	 , email_verified
	 , photo_url
	 , traits
	 , data
	 , provider_id
	 , created_at
	 , updated_at
	 , disabled
  from jsonb_to_recordset($1) as user_ids(user_id uuid)
  join users on users.id = user_ids.user_id
 where project_id = $2