

// db/index.js
// This file creates the Drizzle instance
// Think of it as the "smart layer" that sits between
// your JavaScript code and the raw MySQL connection
//
// Without Drizzle: you write raw SQL strings
//   "SELECT * FROM users WHERE email = ?"
//
// With Drizzle: you write JavaScript
//   db.select().from(users).where(eq(users.email, email))
//
// Drizzle converts your JavaScript into SQL automatically
 
import { drizzle } from 'drizzle-orm/mysql2';
import pool from '../config/db.js';
import * as schema from './schema.js';
// import * as schema → imports EVERYTHING exported from schema.js
// so schema.users and schema.items are available
 
const db = drizzle(pool, { schema, mode: 'default' });
// drizzle(pool, ...) → wraps our MySQL connection pool with Drizzle's features
// { schema } → tells Drizzle about our tables so it can work with them
// mode: 'default' → standard MySQL mode (not PlanetScale serverless)
 
export default db;
// export the db instance so controllers can import and use it