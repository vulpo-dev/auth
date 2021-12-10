
select password_alg as "alg: PasswordAlg"
  from project_settings
 where project_settings.project_id = $1
