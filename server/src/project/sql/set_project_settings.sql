update project_settings
   set name = $2
     , domain = $3
 where project_id = $1