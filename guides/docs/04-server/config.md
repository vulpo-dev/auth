---
sidebar_position: 1
description: Server configuration
---

# Config

You can configure the server either through environment variables or a `Vulpo.toml` file.

## Environment Variables

| Variable | Type | Default Value | Required |
| -------- | ---- | ------------- | -------- |
| VULPO_SECRETS_PASSPHRASE | string | - | Yes |
| VULPO_DB_PORT | u16 | 5432 | No |
| VULPO_DB_USERNAME | string | postgres | No |
| VULPO_DB_PASSWORD | string | postgres | No |
| VULPO_DB_LOG_LEVEL | Off \| Error \| Warn \| Info \| Debug \| Trace | - | Yes |
| VULPO_DB_HOST | string | localhost | No |
| VULPO_DB_DATABASE_NAME | string | auth | No |
| VULPO_RUN_MIGRATIONS[^1] | boolean | false | No |
| VULPO_MAIL_LOCALHOST[^2] | boolean | false | No |

Additionaly Vulpo Auth is using [Rocket](https://rocket.rs/) for the web framework and thus environment variables with the `VULPO_SERVER_` prefix will use the same configuration options as Rocket. You have to replace the `ROCKET_` prefix with the `VULPO_SERVER_` prefix. https://rocket.rs/v0.5-rc/guide/configuration/#environment-variables


## Vulpo.toml

By default, the server will look for a `Vulpo.toml` file in the current directory. Alternatively you can also pass a `--config` flag pointing to a `toml` file.
```bash
vulpo_auth server --config "vulpo/config/path/Vulpo.toml"
```

### Example `Vulpo.toml`
```toml
[server]
address = "127.0.0.1"
port = 8000
workers = 16
keep_alive = 5
ident = "Rocket"
log_level = "normal"
cli_colors = true

[secrets]
## NOTE: Generate your own secure key!
passphrase = "password"

[database]
host = "localhost"
database_name = "auth"
username = "postgres"
password = "postgres"
port = 5432
log_level = "Off"
```

## Footnotes
[^1] Will run migrations on start up when the variable is present  
[^2] When Email host is equal to localhost, an insecure SMTP connection will be used, you can use this variable to overwrite the local email host  