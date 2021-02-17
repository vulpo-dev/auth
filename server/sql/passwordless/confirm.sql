
with confirm_token as (
	update passwordless
	   set confirmed = True
	 where id = $1
 returning email, project_id, id
)
update passwordless
   set is_valid = False
  from confirm_token
 where passwordless.email = confirm_token.email
   and passwordless.project_id = confirm_token.project_id
   and passwordless.id != confirm_token.id