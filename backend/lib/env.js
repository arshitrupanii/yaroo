const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const productionRequiredEnvVars = ["FRONTEND_URL", "REDIS_URL"];

const optionalEnvVars = [
  "PORT",
  "NODE_ENV",
  "FRONTEND_URL",
  "PASSWORD_RESET_URL",
  "CLOUDINARY_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "EMAIL_PROVIDER",
  "EMAIL_FROM",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_SECURE",
  "MONGO_AUTO_INDEX",
  "MONGO_MAX_POOL_SIZE",
  "MONGO_MIN_POOL_SIZE",
  "MONGO_MAX_IDLE_TIME_MS",
  "MONGO_SERVER_SELECTION_TIMEOUT_MS",
  "MONGO_SOCKET_TIMEOUT_MS",
  "REDIS_URL",
  "LOG_CLIENT_ERRORS",
  "EXPOSE_ERROR_STACK",
];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }

  if (process.env.NODE_ENV === "production") {
    const missingProduction = productionRequiredEnvVars.filter((key) => !process.env[key]?.trim());
    if (missingProduction.length > 0) {
      throw new Error(`Missing production environment variable(s): ${missingProduction.join(", ")}`);
    }
  }

  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
};

export const printEnvHelp = () => {
  console.error("Backend configuration error.");
  console.error(`Required env vars: ${requiredEnvVars.join(", ")}`);
  console.error(`Production-only required env vars: ${productionRequiredEnvVars.join(", ")}`);
  console.error(`Optional env vars: ${optionalEnvVars.join(", ")}`);
  console.error("Copy .env.example to .env and fill the missing values.");
};
