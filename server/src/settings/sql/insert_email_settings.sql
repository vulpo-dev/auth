insert into email_settings(project_id, host, from_name, from_email, password, username, port)
values($1, $2, $3, $4, $5, $6, $7)
on conflict (project_id)
  do update
        set host = $2
          , from_name = $3
          , from_email = $4
          , password = $5
          , username = $6
          , port = $7 