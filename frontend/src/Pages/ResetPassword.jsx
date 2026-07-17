import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Lock, MessageSquare } from "lucide-react";
import { useAuthStore } from "../store/useAuhstore";

const isStrongPassword = (password) => (
  password.length >= 8 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password)
);

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const { resetPassword, isLoading } = useAuthStore();

  const validateForm = () => {
    if (!token) return toast.error("Reset token is missing");
    if (!formData.password) return toast.error("Password is required");
    if (!isStrongPassword(formData.password)) {
      return toast.error("Password must be at least 8 characters and include uppercase, lowercase, and a number");
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm() !== true) return;

    const success = await resetPassword(token, formData.password);
    if (success) navigate("/");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-base-200 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-base-300 bg-base-100 shadow-xl p-6 sm:p-8">
        <div className="w-full space-y-7">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-md bg-primary text-primary-content flex items-center justify-center group-hover:opacity-90 transition-colors">
                <MessageSquare className="size-6" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Create New Password</h1>
              <p className="text-base-content/60">Choose a stronger password for your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">New Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10 pr-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="link link-primary">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
