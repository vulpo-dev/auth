
with create_token as (
	insert into tokens(expire, project_id)
	values ($1, $2)
	returning id
), map_users as (
	insert into token_user(token_id, user_id)
	select create_token.id as token_id
		 , u.user_id
	  from create_token
	     , jsonb_to_recordset($3) as u(user_id uuid)
	returning token_id
)
select distinct map_users.token_id
  from map_users