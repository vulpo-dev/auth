select confirmed
	 , is_valid
  from passwordless
 where id = $1