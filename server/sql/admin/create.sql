
insert into admins(email, password)
values($1, $2)
returning id
