const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-z0-9_]{3,24}$/;

export const passwordRules = [
  {
    id: "length",
    label: "8-128 characters",
    test: (password) => password.length >= 8 && password.length <= 128,
  },
  {
    id: "lower",
    label: "lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "upper",
    label: "uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "number",
    test: (password) => /\d/.test(password),
  },
];

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const normalizeUsername = (username) => username.trim().toLowerCase();

export const isValidEmail = (email) => emailPattern.test(normalizeEmail(email));

export const isValidUsername = (username) => usernamePattern.test(normalizeUsername(username));

export const getPasswordChecks = (password) => (
  passwordRules.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }))
);

export const isStrongPassword = (password) => (
  passwordRules.every((rule) => rule.test(password))
);
