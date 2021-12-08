
select passwords.hash
     , passwords.alg as "alg: PasswordAlg"
  from users
  join passwords on passwords.user_id = users.id
 where users.email = $1
   and users.project_id = $2 