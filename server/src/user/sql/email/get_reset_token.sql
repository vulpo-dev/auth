
select reset_token as token
     , state as "state: EmailChangeState"
  from email_change_request
 where id = $1