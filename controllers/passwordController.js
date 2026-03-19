import { generateOTP, generateToken } from '../controllers/verifyController.js';
import argon2 from 'argon2';
import { db }                        from '../config/db.js';
import { users, passwordResets }     from '../db/schema.js';
import { eq }                        from 'drizzle-orm';
import { sendPasswordResetEmail }    from '../services/emailService.js';


// ── Helper: save reset record to DB ──────────────────────────────────────────
const savePasswordReset = async (userId, otp, token) => {
  // delete any existing reset record for this user first
  await db.delete(passwordResets).where(eq(passwordResets.userId, userId));

  // expires in 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(passwordResets).values({ userId, otp, token, expiresAt });
};

//!── GET /forgot-password ──────────────────────────────────────────────────────
export const getForgotPassword = async (req, res) => {
  res.render('verification/forgot-password', { title: 'Forgot Password' });
};

//! ── POST /forgot-password ─────────────────────────────────────────────────────
export const postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash('error', 'Please enter your email address');
      return res.redirect('/forgot-password');
    }

    // find user by email
    const [user] = await db.select().from(users) .where(eq(users.email, email.toLowerCase().trim())).limit(1);

    // don't reveal if email exists or not for security
    if (!user) {
      req.flash('success', 'If an account exists with this email, you will receive a reset code shortly.');
      return res.redirect('/reset-password');
    }

    // generate OTP and token
    const otp   = generateOTP();
    const token = generateToken();

    // save reset record to DB
    await savePasswordReset(user.id, otp, token);

    // send reset email
    await sendPasswordResetEmail({ name: user.name, email: user.email, otp, token });

    // store userId in session for next steps
    req.session.resetUserId = user.id;

    req.flash('success', 'Reset code sent! Please check your inbox.');
    res.redirect('/reset-password');

  } catch (err) {
    console.error('postForgotPassword error:', err.message);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/forgot-password');
  }
};



// ── POST /forgot-password/resend ──────────────────────────────────────────────
export const resendResetCode = async (req, res) => {
  try {
    const userId = req.session.resetUserId;

    if (!userId) {
      req.flash('error', 'Session expired. Please start again.');
      return res.redirect('/forgot-password');
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/forgot-password');
    }

    const otp   = generateOTP();
    const token = generateToken();

    await savePasswordReset(user.id, otp, token);
    await sendPasswordResetEmail({ name: user.name, email: user.email, otp, token });

    req.flash('success', 'Reset code resent! Please check your inbox.');
    res.redirect('/reset-password');

  } catch (err) {
    console.error('resendResetCode error:', err.message);
    req.flash('error', 'Failed to resend code. Please try again.');
    res.redirect('/reset-password');
  }
};

// ── GET /reset-password ───────────────────────────────────────────────────────
export const getResetPassword = async (req, res) => {
  res.render('verification/reset-password', { title: 'Reset Password' });
};

// ── POST /reset-password ──────────────────────────────────────────────────────
export const postResetPassword = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId  = req.session.resetUserId;

    if (!userId) {
      req.flash('error', 'Session expired. Please start again.');
      return res.redirect('/forgot-password');
    }

    const [record] = await db.select().from(passwordResets)
      .where(eq(passwordResets.userId, userId))
      .limit(1);

    if (!record) {
      req.flash('error', 'No reset code found. Please request a new one.');
      return res.redirect('/reset-password');
    }

    // check if expired
    if (new Date() > new Date(record.expiresAt)) {
      req.flash('error', 'Code has expired. Please request a new one.');
      return res.redirect('/forgot-password');
    }

    // check if OTP matches
    if (record.otp !== otp) {
      req.flash('error', 'Invalid code. Please try again.');
      return res.redirect('/reset-password');
    }

    // mark as verified in session
    req.session.resetVerified = true;
    req.session.resetToken    = record.token;

    res.redirect('/new-password');

  } catch (err) {
    console.error('postResetPassword error:', err.message);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/reset-password');
  }
};

// ── GET /reset-password/:token (clickable link) ───────────────────────────────
export const resetPasswordToken = async (req, res) => {
  try {
    const { token } = req.params;

    const [record] = await db.select().from(passwordResets)
      .where(eq(passwordResets.token, token))
      .limit(1);

    if (!record) {
      req.flash('error', 'Invalid or expired reset link.');
      return res.redirect('/forgot-password');
    }

    // check if expired
    if (new Date() > new Date(record.expiresAt)) {
      req.flash('error', 'Reset link has expired. Please request a new one.');
      return res.redirect('/forgot-password');
    }

    // mark as verified in session
    req.session.resetUserId   = record.userId;
    req.session.resetVerified = true;
    req.session.resetToken    = token;

    res.redirect('/new-password');

  } catch (err) {
    console.error('resetPasswordToken error:', err.message);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/forgot-password');
  }
};

// ── GET /new-password ─────────────────────────────────────────────────────────
export const getNewPassword = async (req, res) => {
  // if not verified via OTP or link redirect back
  if (!req.session.resetVerified) {
    req.flash('error', 'Please verify your reset code first.');
    return res.redirect('/forgot-password');
  }

  res.render('verification/new-password', {
    title: 'New Password',
    token: req.session.resetToken
  });
};

// ── POST /new-password ────────────────────────────────────────────────────────
export const postNewPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const userId = req.session.resetUserId;

    if (!req.session.resetVerified || !userId) {
      req.flash('error', 'Session expired. Please start again.');
      return res.redirect('/forgot-password');
    }

    if (!password || !confirmPassword) {
      req.flash('error', 'Please fill in all fields.');
      return res.redirect('/new-password');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/new-password');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/new-password');
    }

    // hash new password
    const hashedPassword = await argon2.hash(password);

    // update password in DB
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));

    // delete reset record
    await db.delete(passwordResets).where(eq(passwordResets.userId, userId));

    // clear reset session data
    delete req.session.resetUserId;
    delete req.session.resetVerified;
    delete req.session.resetToken;

    req.flash('success', 'Password updated successfully! Please login with your new password.');
    res.redirect('/login');

  } catch (err) {
    console.error('postNewPassword error:', err.message);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/new-password');
  }
};