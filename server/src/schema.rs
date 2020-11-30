table! {
    passwordless (id) {
        id -> Uuid,
        created_at -> Timestamptz,
        user_id -> Nullable<Uuid>,
        email -> Text,
        token -> Text,
        is_valid -> Bool,
        project_id -> Nullable<Uuid>,
    }
}

table! {
    projects (id) {
        id -> Uuid,
        name -> Text,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        is_admin -> Bool,
    }
}

table! {
    tokens (id) {
        id -> Uuid,
        user_id -> Nullable<Uuid>,
        expire -> Timestamptz,
        project_id -> Nullable<Uuid>,
        created_at -> Timestamptz,
    }
}

table! {
    users (id) {
        id -> Uuid,
        display_name -> Nullable<Text>,
        password -> Nullable<Text>,
        email -> Text,
        email_verified -> Bool,
        photo_url -> Nullable<Text>,
        traits -> Array<Text>,
        data -> Jsonb,
        provider_id -> Text,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        project_id -> Nullable<Uuid>,
    }
}

joinable!(passwordless -> projects (project_id));
joinable!(tokens -> projects (project_id));
joinable!(tokens -> users (user_id));
joinable!(users -> projects (project_id));

allow_tables_to_appear_in_same_query!(
    passwordless,
    projects,
    tokens,
    users,
);
