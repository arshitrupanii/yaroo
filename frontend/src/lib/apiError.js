const friendlyMessages = {
  AUTH_RATE_LIMITED: "Too many tries. Wait a few minutes.",
  DUPLICATE_VALUE: "That is already taken.",
  INVALID_CREDENTIALS: "Wrong email or password.",
  INVALID_ID: "Something looks invalid.",
  INVALID_JSON: "Something went wrong. Try again.",
  INVALID_RESET_TOKEN: "Reset link expired. Request a new one.",
  INVALID_TOKEN: "Session expired. Sign in again.",
  NETWORK_ERROR: "Cannot reach the server.",
  NOT_FRIENDS: "Add this user as a friend before messaging.",
  PASSWORD_RESET_RATE_LIMITED: "Too many reset requests. Try later.",
  PAYLOAD_TOO_LARGE: "That file is too large.",
  RATE_LIMITED: "Slow down a moment.",
  ROUTE_NOT_FOUND: "This action is unavailable.",
  TOKEN_STALE: "Password changed. Sign in again.",
  UNAUTHORIZED: "Sign in to continue.",
  USER_EXISTS: "Email or username already taken.",
  VALIDATION_ERROR: "Please check the form and try again.",
  WEAK_PASSWORD: "Use a stronger password.",
};

const authFallbacks = {
  forgotPassword: "Could not send reset link.",
  login: "Could not sign in.",
  logout: "Could not sign out.",
  resetPassword: "Could not reset password.",
  signup: "Could not create account.",
  updateProfile: "Could not update profile.",
};

const detailMessages = {
  email: "Enter a valid email.",
  firstname: "Enter your full name.",
  password: "Check your password.",
  profilePicture: "Choose a profile photo.",
  username: "Choose a valid username.",
};

const MAX_ERROR_LENGTH = 88;

const compactMessage = (message) => {
  if (!message || typeof message !== "string") return null;

  const firstLine = message.replace(/\s+/g, " ").trim();
  if (!firstLine) return null;

  return firstLine.length > MAX_ERROR_LENGTH
    ? `${firstLine.slice(0, MAX_ERROR_LENGTH - 3)}...`
    : firstLine;
};

const getDetailMessage = (details) => {
  if (!Array.isArray(details)) return null;

  const detail = details.find((item) => detailMessages[item?.field]) || details[0];
  if (!detail) return null;

  return detailMessages[detail.field] || compactMessage(detail.message);
};

export const getApiErrorMessage = (error, fallback = "Something went wrong") => {
  if (!error?.response && error?.message === "Network Error") {
    return friendlyMessages.NETWORK_ERROR;
  }

  const code = error?.response?.data?.code;
  const detailMessage = getDetailMessage(error?.response?.data?.details);
  const serverMessage = compactMessage(error?.response?.data?.message);

  return friendlyMessages[code] || detailMessage || serverMessage || fallback;
};

export const getApiRequestId = (error) => {
  return error?.response?.data?.requestId || error?.response?.headers?.["x-request-id"];
};

export const formatApiError = (error, fallback) => {
  return getApiErrorMessage(error, fallback);
};

export const formatAuthError = (error, action) => {
  return getApiErrorMessage(error, authFallbacks[action] || "Auth failed.");
};

export const formatApiErrorWithRequestId = (error, fallback) => {
  const message = getApiErrorMessage(error, fallback);
  const requestId = getApiRequestId(error);

  return requestId ? `${message} (${requestId})` : message;
};
