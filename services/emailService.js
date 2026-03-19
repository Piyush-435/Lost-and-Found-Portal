import { Resend }          from 'resend';
import mjml2html           from 'mjml';
import verifyEmailTemplate from '../templates/verifyEmail.mjml.js';
import resetPasswordTemplate from '../templates/resetPassword.mjml.js';


const resend = new Resend(process.env.RESEND_API_KEY);

//!sends verification email with OTP and clickable link
export const sendVerificationEmail = async ({ name, email, otp, token }) => {

  // build verification link using APP_URL from .env
  const verifyLink = `${process.env.APP_URL}/verify-email/${token}`;

  // convert MJML template to HTML
  const { html, errors } = mjml2html(verifyEmailTemplate({ name, otp, verifyLink }));

  // throw error if MJML compilation fails
  if (errors && errors.length > 0) {
    console.error('MJML errors:', errors);
    throw new Error('Failed to generate email template');
  }

  // send email via Resend
  const { error } = await resend.emails.send({
    from   : process.env.FROM_EMAIL,
    to     : email,
    subject: '🔍 Verify your Lost & Found account',
    html,
  });

  // throw error if Resend fails
  if (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send verification email');
  }
};

//! sends password reset email with OTP and clickable link
export const sendPasswordResetEmail = async ({ name, email, otp, token }) => {

  // build reset link using APP_URL from .env
  const resetLink = `${process.env.APP_URL}/reset-password/${token}`;

  // convert MJML template to HTML
  const { html, errors } = mjml2html(resetPasswordTemplate({ name, otp, resetLink }));

  // throw error if MJML compilation fails
  if (errors && errors.length > 0) {
    console.error('MJML errors:', errors);
    throw new Error('Failed to generate email template');
  }

  // send email via Resend
  const { error } = await resend.emails.send({
    from   : process.env.FROM_EMAIL,
    to     : email,
    subject: '🔐 Reset your Lost & Found password',
    html,
  });

  // throw error if Resend fails
  if (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send password reset email');
  }
};