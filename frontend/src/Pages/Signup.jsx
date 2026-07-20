import { useState } from "react";
import { useAuthStore } from "../store/useAuhstore";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import toast from "react-hot-toast";
import PasswordChecklist from "../components/PasswordChecklist";
import {
  isStrongPassword,
  isValidEmail,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
} from "../lib/authValidation";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { signup, isLoading } = useAuthStore();

  const validateForm = () => {
    if (!formData.firstname.trim()) return toast.error("Enter your name.");
    if (!isValidUsername(formData.username))
      return toast.error("Username can use letters, numbers and underscore.");
    if (!formData.email.trim()) return toast.error("Enter your email.");
    if (!isValidEmail(formData.email)) return toast.error("Enter a valid email.");
    if (!formData.password) return toast.error("Create a password.");
    if (!isStrongPassword(formData.password))
      return toast.error("Use 8+ chars with upper, lower and number.");
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) {
      await signup({
        firstname: formData.firstname.trim(),
        username: normalizeUsername(formData.username),
        email: normalizeEmail(formData.email),
        password: formData.password,
      });
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-base-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md p-2 sm:p-4">
        <div className="w-full space-y-7">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <BrandLogo size="md" className="transition-transform duration-200 group-hover:-translate-y-0.5" />
              <h1 className="text-2xl font-bold mt-2">Create Account</h1>
              <p className="text-base-content/60">
                Get started with your free account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="John Doe"
                  autoComplete="name"
                  value={formData.firstname}
                  onChange={(e) =>
                    setFormData({ ...formData, firstname: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Username</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="john_doe"
                  autoComplete="username"
                  inputMode="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value.toLowerCase() })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10 pr-10`}
                  placeholder="Password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
              <div className="mt-3">
                <PasswordChecklist password={formData.password} />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
export default SignUpPage;
