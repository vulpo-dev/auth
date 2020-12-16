
select id
     , name
  from projects
 where is_admin = False
 order by created_at 