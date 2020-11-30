
update tokens
   set expire = now() + interval '1 minute'
where id = $1
returning user_id