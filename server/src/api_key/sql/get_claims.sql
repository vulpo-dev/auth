
select users.id as "sub"
     , users.traits as "traits"
     , users.project_id as "iss"
     , extract(epoch from now() + interval '15 minutes')::numeric::bigint as "exp!"
  from api_keys
  join users on users.id = api_keys.user_id
 where api_keys.id = $1