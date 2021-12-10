
with update_password as (
   insert into passwords (hash, user_id, alg)
   values ($2, $1, $3)
	on conflict (user_id) do update
      set hash = $2
        , alg = $3
	returning user_id
)
update users
   set state = case when state = 'SetPassword'
                    then 'Active'
                    else state
               end
  from update_password
 where users.id = update_password.user_id
