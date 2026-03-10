import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import techShieldLogo from "@/assets/tech-shield.png";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      {/* Subtle page background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-48 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "hsl(239 84% 62%)" }} />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "hsl(217 91% 60%)" }} />
      </div>

      {/* ── Centered Card ── */}
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col md:flex-row"
        style={{ boxShadow: "0 25px 60px -12px rgba(99,102,241,0.25), 0 8px 24px -8px rgba(0,0,0,0.12)" }}
      >
        {/* ── LEFT: Brand section ── */}
        <div
          className="flex flex-col items-center justify-center md:w-5/12 p-10 relative overflow-hidden min-h-[320px]"
          style={{ background: "linear-gradient(145deg, hsl(239 84% 58%), hsl(217 91% 52%))" }}
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-white/5" />

          {/* Brand content — logo → title → subtitle, all centered */}
          <div className="relative flex flex-col items-center text-center">
            <div className="w-36 h-36 rounded-full overflow-hidden mb-6 shadow-xl ring-4 ring-white/30">
              <img src={techShieldLogo} alt="LexGuard AI" className="w-full h-full object-cover scale-110" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight leading-tight">
              LexGuard AI
            </h1>
            <p className="mt-2 text-sm font-medium text-white/80 leading-snug">
              AI-Powered Legal Due Diligence Platform
            </p>
          </div>

          <p className="absolute bottom-4 text-white/40 text-xs">
            © {new Date().getFullYear()} LexGuard AI. All rights reserved.
          </p>
        </div>

        {/* ── RIGHT: Login form ── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 py-10 sm:px-12">
          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">
              Login to your account
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your credentials to access the platform.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, hsl(239 84% 62%), hsl(217 91% 60%))" }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in…
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Create account */}
          <Link
            to="/register"
            className="flex items-center justify-center w-full py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
