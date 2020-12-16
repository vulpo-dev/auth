-- This file should undo anything in `up.sql`

drop index if exists user_email_idx;
drop index if exists user_project_idx;
drop index if exists user_created_at_idx;
drop index if exists user_traits_idx;
drop index if exists user_data_idx;
drop table if exists users;
