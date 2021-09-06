with insert_template as (
    insert into templates(body, name, project_id, of_type)
    values ($1, $2, $3, 'view')
    on conflict (project_id, name) do update set body = $1
    returning id
)
insert into template_data(from_name, subject, template_id, redirect_to, of_type)
select $4 as from_name
     , $5 as subject
     , insert_template.id as template_id
     , $6 as redirect_to
     , $7 as of_type
  from insert_template 
on conflict (template_id, of_type)
  do update set from_name = $4
              , subject = $5
              , redirect_to = $6