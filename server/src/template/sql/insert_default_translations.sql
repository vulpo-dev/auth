with raw_template_data as (
    select *
      from jsonb_to_recordset($1)
        as x(
           id uuid
         , translation jsonb
         , template_type text
         )
)
insert into template_translations
select raw_template_data.id as template_id
     , 'en' as language
     , raw_template_data.translation
  from raw_template_data
 where raw_template_data.template_type = 'view'