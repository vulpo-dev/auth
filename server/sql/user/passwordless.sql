insert into users
	( email
	, project_id
	, provider_id
	, email_verified
	)
values
	( $1
	, $2
	, 'link'
	, true
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