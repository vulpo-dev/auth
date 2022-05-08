
select user_id
  from oauth_data
 where provider_id = $1
   and provider = $2
   and project_id = $3
