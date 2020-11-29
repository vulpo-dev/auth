
select count(*) > 0 as has_admin
  from projects
  join users on users.id = projects.id
 where projects.is_admin = True