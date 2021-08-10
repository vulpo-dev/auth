import { Pool } from 'pg'

let pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  database: 'auth',
  port: 6543,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export default pool
