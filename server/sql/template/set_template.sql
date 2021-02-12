
insert into templates(from_name, subject, body, redirect_to, of_type, project_id)
values ($1, $2, $3, $4, $5, $6)
on conflict (project_id, of_type)
  do update
        set from_name = $1
	   	  , subject = $2
	   	  , body = $3
	   	  , redirect_to = $4
