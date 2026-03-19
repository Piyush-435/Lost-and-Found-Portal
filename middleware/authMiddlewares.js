import { db }    from '../config/db.js';
import { users } from '../db/schema.js';
import { eq }    from 'drizzle-orm';

// attach current user to res.locals for all EJS views
export const attachUser = async (req, res, next) => {
  res.locals.currentUser = null;
  res.locals.isLoggedIn  = false;
   
  if (req.session && req.session.userId) {
    try {
      const result = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
      const user   = result[0];
	    
      if (user) {
        const { password, ...safeUser } = user; // don't expose password to views
        res.locals.currentUser = safeUser;
        res.locals.isLoggedIn  = true;
      }
    } catch (err) {
      console.error('attachUser error:', err.message);
    }
  }
  next();
};

// protect routes - redirect to login if not logged in
export const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Reporting needs login');
  res.redirect('/login');
};

// redirect to dashboard if already logged in
export const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  next();
};