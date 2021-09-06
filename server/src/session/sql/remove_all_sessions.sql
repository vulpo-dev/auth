delete from sessions
 where user_id in (
     select sessions.user_id
       from sessions
      where sessions.id = $1 
 )