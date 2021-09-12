insert into users(email, password, project_id, provider_id, device_languages)
values($1, $2, $3, 'password', $4)
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
        , state
        , device_languages