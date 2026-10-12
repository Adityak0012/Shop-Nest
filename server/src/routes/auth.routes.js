import { Router } from 'express';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { env, isProd } from '../config/env.js';
import { body } from 'express-validator';
import { User } from '../models/User.js';
import { protect, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();
const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

/** Tells the login page whether "Sign in with Google" is configured. */
router.get('/config', (_req, res) => {
  res.json({ googleClientId: env.googleClientId || null });
});

/**
 * POST /api/auth/google  { credential }
 * The browser sends the ID token Google issued. We verify its signature and audience here,
 * then sign the person in (creating a customer account the first time).
 */
router.post('/google', body('credential').isString().notEmpty(), validate, async (req, res) => {
  if (!googleClient) throw new ApiError(503, 'Google sign-in is not configured on this server');
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Google sign-in failed. Please try again.');
  }
  if (!payload?.email || !payload.email_verified) throw new ApiError(401, 'Your Google email is not verified');
  const email = payload.email.toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    // Random password: Google users never type one, and it cannot be guessed.
    user = await User.create({ name: (payload.name || email.split('@')[0]).slice(0, 60), email, password: crypto.randomBytes(24).toString('hex') });
  }
  res.json({ token: signToken(user), user: user.toPublic() });
});

router.post(
  '/register',
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
  async (req, res) => {
    const { name, email, password } = req.body;
    if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
    const user = await User.create({ name, email, password }); // role is always "customer" here
    res.status(201).json({ token: signToken(user), user: user.toPublic() });
  }
);

router.post(
  '/login',
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Enter your password'),
  validate,
  async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.matchPassword(req.body.password))) {
      throw new ApiError(401, 'Wrong email or password');
    }
    res.json({ token: signToken(user), user: user.toPublic() });
  }
);

/**
 * POST /api/auth/forgot  { email }
 * Always answers the same way so the form cannot be used to discover which emails have accounts.
 * No email provider is wired up yet: the reset link is printed in the server console, and outside
 * production it is also returned so the demo UI can show it.
 */
router.post('/forgot', body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(), validate, async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  let devResetLink;
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const link = `${env.clientUrl}/reset-password/${token}`;
    console.log(`[auth] Password reset link for ${user.email}: ${link}`);
    if (!isProd) devResetLink = link;
  }
  res.json({ message: 'If that email has an account, a reset link has been sent.', devResetLink });
});

/** POST /api/auth/reset  { token, password } */
router.post(
  '/reset',
  body('token').isString().isLength({ min: 32, max: 128 }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
  async (req, res) => {
    const hash = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const user = await User.findOne({ resetTokenHash: hash, resetExpires: { $gt: new Date() } }).select('+resetTokenHash +resetExpires');
    if (!user) throw new ApiError(400, 'This reset link is invalid or has expired. Request a new one.');
    user.password = req.body.password;
    user.resetTokenHash = undefined;
    user.resetExpires = undefined;
    await user.save();
    res.json({ token: signToken(user), user: user.toPublic() });
  }
);

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

router.put('/me/address', protect, async (req, res) => {
  const { fullName, phone, line1, line2, city, state, pincode } = req.body;
  req.user.address = { fullName, phone, line1, line2, city, state, pincode };
  await req.user.save();
  res.json({ user: req.user.toPublic() });
});

export default router;
