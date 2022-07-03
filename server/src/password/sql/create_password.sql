
insert into passwords (hash, user_id, alg, project_id)
values ($2, $1, $3, $4)
on conflict (user_id) do update
  set hash = $2
    , alg = $3