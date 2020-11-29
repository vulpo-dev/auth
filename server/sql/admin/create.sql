
insert into users
	( email
	, password
	, project_id
	, traits
	, data
	, provider_id
	)
values
	( $1
	, $2
	, $3
	, '{ "Admin" }'
	, '{}'::jsonb
	, 'email'
	)
returning id