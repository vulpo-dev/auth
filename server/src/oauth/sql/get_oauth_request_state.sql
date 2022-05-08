
select request_id
     , csrf_token
     , pkce_code_verifier
     , created_at
  from oauth_request_state
 where request_id = $1
