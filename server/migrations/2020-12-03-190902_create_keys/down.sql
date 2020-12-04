-- This file should undo anything in `up.sql`

delete index if exists project_key_idx;
delete table if exists project_keys;