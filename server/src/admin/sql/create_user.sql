
insert into users
    ( email
    , display_name
    , data
    , provider_id
    , project_id
    , state
    )
select $1 as "email"
     , $2 as "display_name"
     , $3::jsonb as "data"
     , $4 as "provider_id"
     , $5 as "project_id"
     , case when $4 = 'link'
            then 'Active'
            else 'SetPassword'
        end as "state"
returning id
