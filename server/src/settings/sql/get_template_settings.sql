select email_settings.host
     , coalesce(nullif(template_data.from_name, ''), email_settings.from_name) as "from_name!"
     , email_settings.from_email
     , email_settings.password
     , email_settings.username
     , email_settings.port
     , template_data.subject as "subject?"
     , templates.body as "body?"
     , template_data.redirect_to as "redirect_to?"
     , project_settings.domain
     , project_settings.name
  from email_settings
  left join templates on templates.project_id = email_settings.project_id
                     and templates.name = $2
  left join template_data on template_data.template_id = templates.id
  left join project_settings on project_settings.project_id = email_settings.project_id
 where email_settings.project_id = $1