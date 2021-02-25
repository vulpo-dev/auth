select token, user_id, created_at
  from verify_email
 where id = $1