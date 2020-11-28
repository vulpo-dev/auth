-- This file should undo anything in `up.sql`

drop index if exists user_email_idx;
drop table if exists users;
