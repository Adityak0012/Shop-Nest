import { Router } from 'express';
import { body } from 'express-validator';
import { User } from '../models/User.js';
import { protect, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

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
