
with insert_admin as (
     insert into users
          ( email
          , project_id
          , traits
          , data
          , provider_id
          )
     values
          ( $1
          , $3
          , '{ "Admin" }'
          , '{}'::jsonb
          , 'email'
          )
     returning id
)
insert into passwords(user_id, alg, hash, project_id)
select insert_admin.id as "user_id"
     , 'argon2id' as "alg"
     , $2 as "hash"
     , $3 as "project_id"
  from insert_admin 
returning user_id as "id"