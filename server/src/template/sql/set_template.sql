with insert_template as (
    insert into templates(body, name, project_id)
    values ($1, $2, $3)
    on conflict (project_id, name) do update set body = $1
    returning id
)
insert into template_data(
    from_name
  , subject
  , template_id
  , redirect_to
  , project_id
)
select $4 as from_name
     , $5 as subject
     , insert_template.id as template_id
     , $6 as redirect_to
     , $3 as "project_id"
  from insert_template 
on conflict (template_id)
  do update set from_name = $4
              , subject = $5
              , redirect_to = $6