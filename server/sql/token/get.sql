
select user_id
	 , project_id
	 , expire
	 , id
  from tokens
 where id = $1