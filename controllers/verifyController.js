import crypto from 'crypto';
import { sendVerificationEmail } from '../services/emailService.js';
import { emailVerifications,users} from '../db/schema.js';
import { db }                from '../config/db.js';
import { eq }                from 'drizzle-orm';

// ── Helper: generate 6-digit OTP ─────────────────────────────────────────────
export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Helper: generate random token for verify link ────────────────────────────
export const generateToken = () => crypto.randomBytes(32).toString('hex');

// ── Helper: save verification record to DB ────────────────────────────────────
export const saveVerification = async (userId, otp, token) => {
  // delete any existing verification for this user first
  await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));

  // expires in 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(emailVerifications).values({ userId, otp, token, expiresAt });
};

// ── GET /verify-email ─────────────────────────────────────────────────────────
export const getVerifyEmail = async (req, res) => {
  // if already verified redirect to dashboard
  if (res.locals.currentUser.emailVerified) {
    req.flash('success', 'Email already verified!');
    return res.redirect('/dashboard');
  }
  res.render('verification/verify-email', { title: 'Verify Email' });
};

// ── POST /verify-email (OTP submission) ───────────────────────────────────────
export const postVerifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId  = res.locals.currentUser.id;

    // find verification record for this user
    const result = await db.select().from(emailVerifications)
      .where(eq(emailVerifications.userId, userId))
      .limit(1);

    const record = result[0];

    if (!record) {
      req.flash('error', 'No verification code found. Please request a new one.');
      return res.redirect('/verify-email');
    }

    // check if expired
    if (new Date() > new Date(record.expiresAt)) {
      req.flash('error', 'Code has expired. Please request a new one.');
      return res.redirect('/verify-email');
    }

    // check if OTP matches
    if (record.otp !== otp) {
      req.flash('error', 'Invalid code. Please try again.');
      return res.redirect('/verify-email');
    }

    // mark email as verified in users table
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, userId));

    // delete used verification record
    await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));

    req.flash('success', 'Email verified successfully! Welcome aboard 🎉');
    res.redirect('/dashboard');

  } catch (err) {
    console.error('postVerifyEmail error:', err.message);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/verify-email');
  }
};

// ── GET /verify-email/:token (clickable link from email) ──────────────────────
export const verifyEmailToken = async (req, res) => {
  try {
    const { token } = req.params;

    // find verification record by token
    const result = await db.select().from(emailVerifications)
      .where(eq(emailVerifications.token, token))
      .limit(1);

    const record = result[0];

    if (!record) {
      req.flash('error', 'Invalid or expired verification link.');
      return res.redirect('/login');
    }

    // check if expired
    if (new Date() > new Date(record.expiresAt)) {
      req.flash('error', 'Verification link has expired. Please request a new one.');
      return res.redirect('/login');
    }

    // mark email as verified
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, record.userId));

    // delete used verification record
    await db.delete(emailVerifications).where(eq(emailVerifications.userId, record.userId));

    // create session if not already logged in
    req.session.userId = record.userId;

    req.flash('success', 'Email verified successfully! Welcome aboard 🎉');
    res.redirect('/dashboard');

  } catch (err) {
    console.error('verifyEmailToken error:', err.message);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/login');
  }
};

// ── POST /resend-verification ─────────────────────────────────────────────────
export const resendVerification = async (req, res) => {
  try {
    const user = res.locals.currentUser;

    if (user.emailVerified) {
      return res.json({ success: false, message: 'Email already verified!' });
    }

    const otp   = generateOTP();
    const token = generateToken();

    await saveVerification(user.id, otp, token);
    await sendVerificationEmail({ name: user.name, email: user.email, otp, token });

    res.json({ success: true });

  } catch (err) {
    console.error('resendVerification error:', err.message);
    res.json({ success: false, message: 'Failed to send email. Please try again.' });
  }
};