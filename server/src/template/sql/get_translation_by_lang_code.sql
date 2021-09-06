with languages as (
    select array_append($2, project_settings.default_language) as languages
      from project_settings
     where project_id = $1

)
select lang.prio, template_translations.content
  from languages, unnest(languages.languages) WITH ORDINALITY AS lang(code, prio)
  join templates on templates.name = $3
  join template_translations on template_translations.language = lang.code
                            and template_translations.template_id  = templates.id
 order by lang.prio
 limit 1