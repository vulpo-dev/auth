
with created_project as (
       insert into projects
      default values
    returning id
), create_project_settings as (
    insert into project_settings(project_id, name, domain)
    select created_project.id as "project_id"
         , $1 as "name"
         , $2 as "domain"
      from created_project
    returning project_id
)
insert into project_keys(project_id, public_key, private_key, is_active, expire_at)
select create_project_settings.project_id
     , $3 as "public_key"
     , $4 as "private_key"
     , $5 as "is_active"
     , $6 as "expire_at"
  from create_project_settings
returning project_id as id