import  argon2  from 'argon2';
import { users,tokens } from '../db/schema.js';
import { db } from '../config/db.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';
import  jwt  from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { generateOTP, generateToken, saveVerification } from '../controllers/verifyController.js';
import { sendVerificationEmail } from '../services/emailService.js';

 
// ── Helper: generate access token (short lived) ───────────────────────────────
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
}
 
// ── Helper: generate refresh token (long lived) ───────────────────────────────
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
}
 
// ── Helper: save refresh token to DB ─────────────────────────────────────────
async function saveRefreshToken(userId, refreshToken) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await db.insert(tokens).values({ userId, refreshToken, expiresAt });
}



//making a func for rendering register page
export const getRegister = async(req, res) => {
	res.render('register', { title: 'Register' });
};


//making a func for Storing the details of the user after submitting register page
export const postRegister = async(req, res) => {

	try {
         //Zod Validation
		const validation = registerSchema.safeParse(req.body);
		if (!validation.success) {
			const firstError = validation.error?.issues?.[0]?.message || "Invalid input";
			req.flash('error', firstError);
			return res.redirect('/register');
      	}	
		const {fullName,email,phone,password} = validation.data;

		//! checking if the useremail already exists in the users table or not
		const [emailcheck]=await db.select().from(users).where(eq(users.email,email)).limit(1);
		 if (emailcheck) {
		req.flash('error', 'An account with this email already exists');
		return res.redirect('/register');
    	}
        
		//! hashing password using argon2
		 const hashedPassword=await argon2.hash(password)
        
		 //! inserting the data in the DB
    		const insertResult = await db.insert(users).values({
				name    : fullName,
				email   : email.toLowerCase().trim(),
				phone   : phone || '',
				password: hashedPassword,
            });
		
		//!Now generating access and refresh tokens
		// fetch the newly created user
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    // generate tokens
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // save refresh token to DB
    await saveRefreshToken(user.id, refreshToken)

   //storing access tokens and userid in the session
   req.session.userId=user.id;
   req.session.accessToken=accessToken;
   
// save session before redirecting
req.session.save(async(err) =>{
  if (err) console.error('Session save error:', err);
  req.flash('success', 'Account created successfully! Welcome aboard 🎉');
  // generate OTP and token
const otp   = generateOTP();
const token = generateToken();

// save verification to DB
await saveVerification(user.id, otp, token);

// send verification email
await sendVerificationEmail({ name: user.name, email: user.email, otp, token });

// redirect to verify email page
res.redirect('/verify-email');
});

    }catch (error) {
	console.error(error);
	console.error('postRegister error:', error.message);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/register');
}
}

//!making function for getloginpage
export const getLogin=async(req,res)=>{
	res.render("login",{title:"Login"})
}

//!making func for postloginpage
 

export const postLogin = async (req, res) => {
  try {
 
    // ── Zod validation 
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message;
      req.flash('error', firstError);
      return res.redirect('/login');
    }
 
    const { email, password } = validation.data;
 
    // find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    
 
    if (!user) {
      req.flash('error', 'User not exist Please register first');
      return res.redirect('/login');
    }
 
    // verify password using argon2
    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }
 
    // generate tokens
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
 
    // save refresh token to DB
    await saveRefreshToken(user.id, refreshToken);
 

	// if "remember me" is checked, keep session for 30 days
	// otherwise session expires when browser closes
	if (req.body.remember === 'on') {
		req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
		} else {
		req.session.cookie.maxAge = null; // session cookie
		}
    // store access token and user id in session
    req.session.userId      = user.id;
    req.session.accessToken = accessToken;
 
    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/dashboard');
 
  } catch (err) {
    console.error('postLogin error:', err.message);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/login');
  }
};



//making func for logout functionality
export const logout = async (req, res) => {
  try {
    // delete refresh token from DB on logout
    if (req.session.userId) {
      await db.delete(tokens).where(eq(tokens.userId, req.session.userId));
    }
  } catch (err) {
    console.error('logout error:', err.message);
  }
 
  // destroy session and redirect to home
  req.session.destroy(() => {
    res.redirect('/');
  });
};


