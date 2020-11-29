
select id
     , display_name
     , email
from users
where id = $1