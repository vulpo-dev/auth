insert into users(email, project_id, provider_id, email_verified, device_languages)
values($1, $2, 'link', true, $3)
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