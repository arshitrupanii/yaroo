import { getAllowedOrigins } from '../lib/cors.js';
import { ApiError } from '../lib/ApiError.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

const getRequestOrigin = (req) => {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  return `${protocol}://${req.get('host')}`;
};

export const trustedOriginMiddleware = (req, res, next) => {
  if (safeMethods.has(req.method)) return next();

  const origin = req.get('origin');
  const fetchSite = req.get('sec-fetch-site');

  if (!origin) {
    if (fetchSite === 'cross-site') {
      return next(new ApiError(403, 'Cross-site request blocked', { code: 'UNTRUSTED_ORIGIN' }));
    }
    return next();
  }

  const allowedOrigins = new Set([getRequestOrigin(req), ...getAllowedOrigins()]);
  if (!allowedOrigins.has(origin)) {
    return next(new ApiError(403, 'Cross-site request blocked', { code: 'UNTRUSTED_ORIGIN' }));
  }

  return next();
};
