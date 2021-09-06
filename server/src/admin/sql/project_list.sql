select id
     , project_settings.name
     , project_settings.domain
  from projects
  join project_settings on project_settings.project_id = projects.id
 where is_admin = False
 order by created_at