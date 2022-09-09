
select id
     , name
     , expire_at
	 , created_at
  from api_keys 
 where user_id = $1
   and project_id = $2
 order by created_at desc 
