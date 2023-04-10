/**
 * $1 := Project ID
 * $2 := Sort Direction
 * $3 := Get users before/after a given date depending on $2
 * $4 := max number of items returned  
 * $5 := optional email search
 * $6 := optional id search
 */

select id
     , email
     , email_verified
     , provider_id
     , created_at
     , state as "state: UserState"
  from users
 where project_id = $1
   and case
            when $2 = 'asc' then created_at >= coalesce($3, now())
            when $2 = 'desc' then created_at <= coalesce($3, now())
        end
    -- User Email
    and case
            when $5::text is null then true
            else email like $5
        end
    -- User Id
    and case
            when $6::uuid is null then true
            else id = $6
        end
 order by case when $2 = 'asc' then created_at end asc
        , case when $2 = 'desc' then created_at end desc
        , id asc
 limit $4