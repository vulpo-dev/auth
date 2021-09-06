update projects
   set is_admin = true
     , flags = '{ "auth::signin", "method::email_password" }'
 where id = $1