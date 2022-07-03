with template as (
	select id, project_id
	  from templates
	 where project_id = $1
	   and name = $2
)
insert into template_translations(project_id, template_id, language, content)
select template.project_id as "project_id"
	  , template.id as template_id
     , $3 as language
     , $4 as content
  from template
on conflict (template_id, language)
   do update set content = $4