import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

/** Requires a valid "Authorization: Bearer <token>" header and loads req.user. */
export async function protect(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Please log in to continue');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Your session has expired, please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Account not found');
  req.user = user;
  next();
}

/** Role-based access: only admins pass. Use after protect. */
export function adminOnly(req, _res, next) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Admin access only');
  next();
}
