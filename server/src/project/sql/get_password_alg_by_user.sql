
select password_alg as "alg: PasswordAlg"
  from users
  join project_settings on project_settings.project_id = users.project_id
 where users.id = $1