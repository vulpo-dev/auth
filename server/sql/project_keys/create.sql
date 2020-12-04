
insert into project_keys
	( project_id
	, public_key
	, private_key
	, is_active
	, expire_at
	)
values($1, $2, $3, $4, $5)
returning id
