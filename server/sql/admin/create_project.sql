
insert into projects(name, is_admin)
values ($1, True)
returning id
