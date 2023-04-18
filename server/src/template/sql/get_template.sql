select template_data.from_name
     , template_data.subject
     , templates.body
     , template_data.redirect_to
     , templates.project_id
  from templates
  join template_data on template_data.template_id = templates.id
 where templates.project_id = $1
   and templates.name = $2