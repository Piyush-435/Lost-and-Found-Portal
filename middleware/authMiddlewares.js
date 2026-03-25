import { db }                                    from '../config/db.js';
import { users, matches, connectionRequests }    from '../db/schema.js';
import { eq, or, and, count }                    from 'drizzle-orm';

// attach current user, match count and connection count to res.locals for all EJS views
export const attachUser = async (req, res, next) => {
  res.locals.currentUser     = null;
  res.locals.isLoggedIn      = false;
  res.locals.matchCount      = 0;
  res.locals.connectionCount = 0;

  if (req.session && req.session.userId) {
    try {
      const result = await db.select().from(users)
        .where(eq(users.id, req.session.userId))
        .limit(1);

      const user = result[0];

      if (user) {
        const { password, ...safeUser } = user;
        res.locals.currentUser = safeUser;
        res.locals.isLoggedIn  = true;

        // fetch count of potential matches for this user
        const countResult = await db.select({ count: count() }).from(matches)
          .where(and(
            eq(matches.status, 'potential'),
            or(
              eq(matches.lostUserId,  user.id),
              eq(matches.foundUserId, user.id)
            )
          ));

        res.locals.matchCount = Number(countResult[0].count);

        // fetch count of pending incoming connection requests
        const connectionCountResult = await db.select({ count: count() }).from(connectionRequests)
          .where(and(
            eq(connectionRequests.toUserId, user.id),
            eq(connectionRequests.status,   'pending')
          ));

        res.locals.connectionCount = Number(connectionCountResult[0].count);
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