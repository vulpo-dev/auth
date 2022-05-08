
select settings
  from oauth
 where project_id = $1
   and provider = $2
