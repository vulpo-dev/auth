-- This file should undo anything in `up.sql`

drop index if exists project_key_idx;
drop table if exists project_keys;