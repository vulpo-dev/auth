-- This file should undo anything in `up.sql`


drop index if exists admin_email_idx;
drop table if exists admins;
