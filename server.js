import 'dotenv/config';

import express      from 'express';
import session      from 'express-session';
import flash        from 'connect-flash';
import path         from 'path';
import { fileURLToPath } from 'url';
import MySQLStore   from 'express-mysql-session';

import connectDB        from './config/db.js';
import { attachUser }   from './middleware/authMiddlewares.js';
import router           from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// ── MYSQL SESSION STORE ───────────────────────────────────────────────────────
// stores sessions in MySQL so they persist across redirects and server restarts
const MySQLStoreSession = MySQLStore(session);

const sessionStore = new MySQLStoreSession({
  host    : process.env.DB_HOST     || 'localhost',
  port    : process.env.DB_PORT     || 3306,
  user    : process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'lostfound',
});

// ── VIEW ENGINE ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── STATIC FILES ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── BODY PARSING ──────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── SESSIONS ──────────────────────────────────────────────────────────────────
app.use(session({
  secret           : process.env.SESSION_SECRET,
  resave           : false,
  saveUninitialized: false,
  store            : sessionStore, // ← persist sessions in MySQL
  cookie: {
   
    httpOnly: true,
    secure  : process.env.NODE_ENV === 'production',

  }
}));

// ── FLASH MESSAGES ────────────────────────────────────────────────────────────
app.use(flash());

// ── GLOBAL LOCALS ─────────────────────────────────────────────────────────────
app.use(attachUser);

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error   = req.flash('error');
  next();
});

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use(router);

// ── 404 HANDLER ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// ── ERROR HANDLER ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('404', { title: 'Server Error' });
});

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});