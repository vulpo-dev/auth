with raw_template_data as (
    select *
      from jsonb_to_recordset($1)
        as x(
           id uuid
         , from_name text
         , subject text
         , redirect_to text
         , of_type text
         , template_type text
         , project_id uuid
         )
)
insert into template_data
select raw_template_data.project_id
     , raw_template_data.from_name
     , '{{t.subject}}' as subject
     , raw_template_data.id as template_id
     , raw_template_data.redirect_to
     , raw_template_data.of_type
  from raw_template_data
 where raw_template_data.template_type = 'view'