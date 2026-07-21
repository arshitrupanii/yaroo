const defaultDevelopmentOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
];

export const getAllowedOrigins = () => {
  const configuredOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

  const origins = process.env.NODE_ENV === 'production'
    ? configuredOrigins
    : [...configuredOrigins, ...defaultDevelopmentOrigins];

  return [...new Set(origins)];
};

export const isAllowedRequestOrigin = (origin, host, protocol = 'http') => {
  if (!origin) return true;

  const requestOrigin = host ? `${protocol}://${host}` : null;
  return origin === requestOrigin || getAllowedOrigins().includes(origin);
};

export const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
};
