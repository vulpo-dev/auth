// Update with your config settings.

exports.development = {
  client: 'postgresql',
  connection: {
    database: 'auth',
    port: 5432,
    user: 'postgres',
    password: 'postgres'
  },
  seeds: {
    directory: './dev'
  }
}