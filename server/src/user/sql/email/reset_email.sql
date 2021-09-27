
with user_email as (
	update email_change_request
	   set state = 'reset'
	 where id = $1
 returning old_email, user_id 
)
update users
   set email = user_email.old_email
  from user_email
 where users.id = user_email.user_id