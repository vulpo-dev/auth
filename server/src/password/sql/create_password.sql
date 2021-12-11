
insert into passwords (hash, user_id, alg)
values ($2, $1, $3)
on conflict (user_id) do update
  set hash = $2
    , alg = $3