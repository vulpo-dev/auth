with languages as (
    select array_append(users.device_languages, project_settings.default_language) as languages
      from users
      join project_settings on project_settings.project_id = users.project_id 
     where id = $1

)
select lang.prio, template_translations.content
  from languages, unnest(languages.languages) WITH ORDINALITY AS lang(code, prio)
  join templates on templates.name = $2
  join template_translations on template_translations.language = lang.code
                            and template_translations.template_id  = templates.id
 order by lang.prio
 limit 1