
update tokens
   set expire = now() + interval '1 minute'
where id = $1