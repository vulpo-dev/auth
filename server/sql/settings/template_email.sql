
select email_settings.host
	 , coalesce(nullif(templates.from_name, ''), email_settings.from_name) as from_name
	 , email_settings.from_email
	 , email_settings.password
	 , email_settings.username
	 , email_settings.port
	 , templates.redirect_to
	 , templates.subject
	 , templates.body
	 , project_settings.domain
	 , project_settings.name
  from email_settings
  left join templates on templates.project_id = email_settings.project_id
                     and templates.of_type = $2
  left join project_settings on project_settings.project_id = email_settings.project_id
 where email_settings.project_id = $1