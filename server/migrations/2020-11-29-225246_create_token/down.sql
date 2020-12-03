-- This file should undo anything in `up.sql`

drop index if exists token_user_token_idx;
drop table if exists token_user;

drop index if exists token_project_idx;
drop table if exists tokens;