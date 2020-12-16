
select count(users.id) as total_users
  from users
 where project_id = $1