delete from template_translations
 where template_translations.language = $1
   and template_translations.template_id in (
    select id
      from templates
     where project_id = $2
       and name = $3
   )