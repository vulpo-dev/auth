
insert into oauth_data(provider_id, provider, email, user_id, project_id)
values($1, $2, $3, $4, $5)
on conflict (provider_id, provider, project_id, user_id)
   do update set email = excluded.email
