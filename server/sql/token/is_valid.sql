
with add_token as (
	insert into tokens(id, session_id, expire_at)
	values($1, $2, $3)
	on conflict(id) do nothing
	returning id
)
select count(add_token.id) = 1 as is_valid
  from add_token