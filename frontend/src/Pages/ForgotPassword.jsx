import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useAuthStore } from "../store/useAuhstore";
import BrandLogo from "../components/BrandLogo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const { forgotPassword, isLoading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) return toast.error("Enter your email.");
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("Enter a valid email.");

    const result = await forgotPassword(email);
    if (result?.resetUrl) setResetUrl(result.resetUrl);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md p-2 sm:p-4">
        <div className="w-full space-y-7">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <BrandLogo size="md" className="transition-transform duration-200 group-hover:-translate-y-0.5" />
              <h1 className="text-2xl font-bold mt-2">Reset Password</h1>
              <p className="text-base-content/60">Enter your email to create a reset link</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="input input-bordered w-full pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>

          {resetUrl && (
            <div className="rounded-md border border-base-300 bg-base-200 p-3 text-sm">
              <div className="font-medium">Development reset link</div>
              <Link to={new URL(resetUrl).pathname} className="link link-primary break-all">
                {resetUrl}
              </Link>
            </div>
          )}

          <div className="text-center">
            <Link to="/login" className="link link-primary inline-flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
