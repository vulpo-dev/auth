update users
   set display_name = $2
     , email = $3
     , traits = $4
     , data = $5
     , email_verified =
            case when email = $3::text
                then True
                else False
            end  
 where id = $1
returning id
        , email_verified
        , email
        , traits
        , display_name
        , data