
with insert_user as (
        insert into users(email, project_id, provider_id, device_languages)
        values($1, $3, 'password', $4)
        returning id
)
insert into passwords(user_id, alg, hash, project_id)
select insert_user.id as "user_id"
     , 'bcrypt' as "alg"
     , $2 as "hash"
     , $3 as "project_id"
  from insert_user 
returning user_id as "id"