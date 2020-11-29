
insert into users
	( email
	, password
	, display_name
	, data
	, provider_id
	, project_id
	)
values
	( $1
	, $2
	, $3
	, $4::jsonb
	, $5
	, $6
	)
returning id