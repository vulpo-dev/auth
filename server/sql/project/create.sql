
with created_project as (
	insert into projects
	default values
	returning id
)
insert into project_settings(project_id, name, domain)
select created_project.id as project_id
     , $1 as "name"
     , $2 as "domain"
  from created_project
returning project_id as id 