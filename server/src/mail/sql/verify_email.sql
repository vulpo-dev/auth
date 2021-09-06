with delete_token as (
    delete from verify_email
     where user_id = $1
     returning user_id
)
update users
   set email_verified = true
  from delete_token
 where id = delete_token.user_id