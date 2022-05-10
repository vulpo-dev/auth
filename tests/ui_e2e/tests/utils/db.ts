import { Pool } from 'pg'

let pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  database: 'auth',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 40000,
  connectionTimeoutMillis: 2000,
})

export default pool
