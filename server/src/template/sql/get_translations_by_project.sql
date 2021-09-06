select template_translations.language
     , template_translations.content
  from templates
  join template_translations on template_translations.template_id = templates.id
 where templates.project_id = $1
   and templates.name = $2