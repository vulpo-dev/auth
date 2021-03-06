select id
     , display_name
     , email
     , email_verified
     , photo_url
     , traits
     , data
     , provider_id
     , created_at
     , updated_at
     , state as "state: UserState"
     , device_languages
  from users
 where id = $1
   and project_id = $2