import { Router } from 'express';
import * as authController from "../controllers/authController.js"
import * as verifyController from "../controllers/verifyController.js"
import * as passwordController from '../controllers/passwordController.js';

import { requireAuth } from '../middleware/authMiddlewares.js';
const router = Router();
 
// Auth routes are added here

//getregisterPage and postregisterPage
router.route("/register").get(authController.getRegister).post(authController.postRegister)


//getloginpage and post login page
router.route("/login").get(authController.getLogin).post(authController.postLogin)

// POST /logout
router.post("/logout",authController.logout)

//!defining routes for email-verification

// verify email page
router.get('/verify-email', requireAuth, verifyController.getVerifyEmail);

// submit OTP code
router.post('/verify-email', requireAuth, verifyController.postVerifyEmail);

// clickable link from email
router.get('/verify-email/:token', verifyController.verifyEmailToken);

// resend verification email
router.post('/resend-verification', requireAuth, verifyController.resendVerification);


//!defining routes for forget/reset password
// forgot password page
router.route('/forgot-password').get(passwordController.getForgotPassword).post(passwordController.postForgotPassword);

// resend reset code
router.post('/forgot-password/resend', passwordController.resendResetCode);

// reset password page (OTP entry)
router.route('/reset-password').get(passwordController.getResetPassword).post(passwordController.postResetPassword);

// clickable link from email
router.get('/reset-password/:token',passwordController.resetPasswordToken);

// new password page
router.route('/new-password').get(passwordController.getNewPassword).post(passwordController.postNewPassword);








export default router;