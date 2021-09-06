update users
   set email_verified = false
 where id = $1
returning users.email