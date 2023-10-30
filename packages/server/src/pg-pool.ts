import { Pool } from 'pg'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('error', (error) => {
  console.error(error)
})
