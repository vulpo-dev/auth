
with update_password as (
   insert into passwords (hash, user_id, alg, project_id)
   values ($2, $1, $3, $4)
	on conflict (user_id) do update
      set hash = $2
        , alg = $3
	returning user_id
)
update users
   set state = case when state = 'set_password'
                    then 'active'
                    else state
               end
  from update_password
 where users.id = update_password.user_id
