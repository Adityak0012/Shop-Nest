import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';
import { isProd } from '../config/env.js';

/** Runs after express-validator chains and returns the first error as a 400. */
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array();
    throw new ApiError(400, errors[0].msg, errors.map((e) => ({ field: e.path, message: e.msg })));
  }
  next();
}

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `That ${field} is already in use`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)[0]?.message || 'Invalid data';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message, details: err.details, ...(isProd || status < 500 ? {} : { stack: err.stack }) });
}
