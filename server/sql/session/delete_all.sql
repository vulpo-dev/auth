
delete from sessions
 where user_id in (
 	select user_sessions.user_id
 	  from sessions
 	  join sessions user_sessions on user_sessions.user_id = sessions.id
 	 where sessions.id = $1 
 )
