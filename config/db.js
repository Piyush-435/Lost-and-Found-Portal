import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '../db/schema.js';

const pool = mysql.createPool({
  host    : process.env.DB_HOST     || 'localhost',
  port    : process.env.DB_PORT     || 3306,
  user    : process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'lostfound',
  waitForConnections: true,
  connectionLimit   : 10,
});

export const db = drizzle(pool, { schema, mode: 'default' });

export const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Connected');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL Connection Error:', err.message);
    process.exit(1);
  }
};

export default connectDB;