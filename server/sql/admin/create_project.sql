
insert into projects(name, is_admin, flags)
values ($1, True, '{ "auth::signin", "method::email_password" }')
returning id
