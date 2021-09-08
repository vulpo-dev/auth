with disable_user as (
    update users
       set state = 'Disabled'
     where id = $1
       and project_id = $2
 returning id
)
delete from sessions
 where user_id in (
    select id as user_id
      from disable_user
 )