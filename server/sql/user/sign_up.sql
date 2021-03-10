insert into users
	( email
	, password
	, project_id
	, provider_id
	)
values
	( $1
	, $2
	, $3
	, 'password'
	)
returning id
		, display_name
		, email
		, email_verified
		, photo_url
		, traits
		, data
		, provider_id
		, created_at
		, updated_at
		, disabled