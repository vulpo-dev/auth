select from_name
	 , subject
	 , body
	 , redirect_to
	 , of_type
	 , project_id
	 , false as is_default
  from templates
 where project_id = $1
   and of_type = $2