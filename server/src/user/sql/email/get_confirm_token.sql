
select token
     , state as "state: EmailChangeState"
     , expire_at
  from email_change_request
 where id = $1