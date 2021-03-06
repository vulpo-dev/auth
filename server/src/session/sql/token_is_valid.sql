with add_token as (
    insert into refresh_access_tokens(id, session_id, expire_at, project_id)
    values($1, $2, $3, $4)
    on conflict(id) do nothing
    returning id
)
select count(add_token.id) = 1 as is_valid
  from add_token