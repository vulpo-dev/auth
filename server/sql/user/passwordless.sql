insert into users
	( email
	, project_id
	, provider_id
	)
values
	( $1
	, $2
	, 'link'
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