update users
   set password = $2
     , state = case when state = 'SetPassword'
                    then 'Active'
                    else state
               end
 where id = $1