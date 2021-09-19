
with new_user_email as (
	update email_change_request
	   set state = 'accept'
	 where id = $1
 returning new_email, user_id 
)
update users
   set email = new_user_email.new_email
  from new_user_email
 where users.id = new_user_email.user_id