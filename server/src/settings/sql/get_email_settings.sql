select host
     , from_name
     , from_email
     , password
     , username
     , port
  from email_settings
 where project_id = $1