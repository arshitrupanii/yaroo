const friendlyMessages = {
  AUTH_RATE_LIMITED: "Too many login attempts. Try again in a few minutes.",
  DUPLICATE_VALUE: "This value is already used.",
  INVALID_CREDENTIALS: "Email or password is wrong.",
  INVALID_RESET_TOKEN: "This reset link is invalid or expired.",
  INVALID_TOKEN: "Your session expired. Please sign in again.",
  NETWORK_ERROR: "Cannot reach the server. Check if backend is running.",
  NOT_FRIENDS: "Add this user as a friend before messaging.",
  PASSWORD_RESET_RATE_LIMITED: "Too many reset attempts. Try again later.",
  RATE_LIMITED: "Too many requests. Try again shortly.",
  ROUTE_NOT_FOUND: "This action is not available.",
  TOKEN_STALE: "Password changed recently. Please sign in again.",
  UNAUTHORIZED: "Please sign in to continue.",
  USER_EXISTS: "Account or username already exists.",
  VALIDATION_ERROR: "Please check the form and try again.",
  WEAK_PASSWORD: "Use 8+ characters with uppercase, lowercase, and a number.",
};

export const getApiErrorMessage = (error, fallback = "Something went wrong") => {
  if (!error?.response && error?.message === "Network Error") {
    return friendlyMessages.NETWORK_ERROR;
  }

  const code = error?.response?.data?.code;
  return friendlyMessages[code] || error?.response?.data?.message || error?.message || fallback;
};

export const getApiRequestId = (error) => {
  return error?.response?.data?.requestId || error?.response?.headers?.["x-request-id"];
};

export const formatApiError = (error, fallback) => {
  return getApiErrorMessage(error, fallback);
};

export const formatApiErrorWithRequestId = (error, fallback) => {
  const message = getApiErrorMessage(error, fallback);
  const requestId = getApiRequestId(error);

  return requestId ? `${message} · ${requestId}` : message;
};
