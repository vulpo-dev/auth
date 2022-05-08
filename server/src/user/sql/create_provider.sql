
insert into users(
	email,
	email_verified,
	display_name,
	photo_url,
	provider_id,
	device_languages,
        project_id
)
values($1, true, $2, $3, $4, $5, $6)
on conflict(email, project_id)
   do update set email_verified = true
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
        , state as "state: UserState"
        , device_languages