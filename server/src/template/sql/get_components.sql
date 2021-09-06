select body
     , name
  from templates
 where of_type = 'index'
    or of_type = 'component'