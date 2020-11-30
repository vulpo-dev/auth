-- This file should undo anything in `up.sql`
drop index if exists token_project_idx;
drop index if exists token_user_id_idx;
drop table if exists tokens;