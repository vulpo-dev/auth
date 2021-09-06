with raw_template_data as (
    select *
     from jsonb_to_recordset($1)
      as x(
          id uuid
        , body text
        , project_id uuid
        , template_type text
        , name text
      )
)
insert into templates
select raw_template_data.id
     , raw_template_data.body
     , raw_template_data.name
     , raw_template_data.template_type as of_type
     , raw_template_data.project_id
  from raw_template_data