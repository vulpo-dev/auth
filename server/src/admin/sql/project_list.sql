select id
     , project_settings.name
     , project_settings.domain
  from projects
  join project_settings on project_settings.project_id = projects.id
 order by is_admin desc
        , created_at