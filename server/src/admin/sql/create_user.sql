insert into users
    ( email
    , password
    , display_name
    , data
    , provider_id
    , project_id
    , state
    )
select $1 as "email"
     , $2 as "password"
     , $3 as "display_name"
     , $4::jsonb as "data"
     , $5 as "provider_id"
     , $6 as "project_id"
     , case when $5 = 'link'
            then 'Active'
            else 'SetPassword'
        end as "state"
returning id