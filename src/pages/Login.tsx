import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import techShieldLogo from "../../Tech-Savvy Shield Logo Design.png";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  // Already logged in → go straight to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoToss, setLogoToss] = useState(false);

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

  const handleLogoClick = () => {
    setLogoToss(true);
  };

  const handleLogoLeave = () => {
    setLogoToss(false);
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center py-0 px-0 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #bfdbfe 0%, #c7d2fe 35%, #cbd5e1 70%, #d1d5db 100%)"
      }}
    >
      {/* Professional Soft Blue Gradient Background - Pale Dark */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top left - soft blue glow */}
        <div 
          className="absolute -top-48 -left-48 w-[900px] h-[900px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #60a5fa 0%, #93c5fd 40%, transparent 70%)" }} 
        />
        
        {/* Top right - soft indigo accent */}
        <div 
          className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full opacity-22 blur-3xl"
          style={{ background: "radial-gradient(circle, #a5b4fc 0%, #818cf8 40%, transparent 70%)" }} 
        />
        
        {/* Bottom left - light blue depth */}
        <div 
          className="absolute -bottom-48 -left-32 w-[850px] h-[850px] rounded-full opacity-24 blur-3xl"
          style={{ background: "radial-gradient(circle, #93c5fd 0%, #bfdbfe 40%, transparent 70%)" }} 
        />
        
        {/* Bottom right - soft indigo blend */}
        <div 
          className="absolute -bottom-40 -right-48 w-[900px] h-[900px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8 0%, #a5b4fc 40%, transparent 70%)" }} 
        />
        
        {/* Center area - lighter glow for login card */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1000px] rounded-full opacity-35 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 0.5) 40%, transparent 70%)" }} 
        />
        
        {/* Mid-left soft accent */}
        <div 
          className="absolute top-1/3 -left-32 w-[600px] h-[600px] rounded-full opacity-18 blur-3xl"
          style={{ background: "radial-gradient(circle, #bfdbfe 0%, transparent 70%)" }} 
        />
        
        {/* Mid-right soft accent */}
        <div 
          className="absolute top-2/3 -right-24 w-[650px] h-[650px] rounded-full opacity-16 blur-3xl"
          style={{ background: "radial-gradient(circle, #c7d2fe 0%, transparent 70%)" }} 
        />
        
        {/* Upper center - subtle highlight */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-22 blur-3xl"
          style={{ background: "radial-gradient(ellipse, #e2e8f0 0%, rgba(226, 232, 240, 0.3) 50%, transparent 70%)" }} 
        />
      </div>

      {/* ── Large Centered Login Container ── */}
      <div
        className="relative w-full max-w-[1600px] h-screen overflow-hidden flex flex-col md:flex-row shadow-2xl"
        style={{ boxShadow: "0 20px 60px -15px rgba(59, 130, 246, 0.2), 0 10px 40px -10px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.05)" }}
      >
        {/* ── LEFT: Brand section ── */}
        <div
          className="flex flex-col items-center justify-center md:w-5/12 p-16 relative overflow-hidden h-full"
          style={{ background: "linear-gradient(145deg, hsl(239 84% 58%), hsl(217 91% 52%))" }}
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-white/5" />

          {/* Brand content — logo → title → subtitle, all centered */}
          <div className="relative flex flex-col items-center text-center">
            <div 
              onMouseEnter={handleLogoClick}
              onMouseLeave={handleLogoLeave}
              className={`w-72 h-72 rounded-full overflow-hidden mb-10 shadow-xl ring-4 ring-white/30 cursor-pointer transition-all ${
                logoToss ? 'animate-toss' : ''
              }`}
            >
              <img src={techShieldLogo} alt="LexGuard AI" className="w-full h-full object-cover scale-110" />
            </div>
            <h1 className="text-5xl font-display font-bold text-white tracking-tight leading-tight">
              LexGuard AI
            </h1>
            <p className="mt-4 text-lg font-medium text-white/80 leading-snug max-w-sm">
              AI-Powered Legal Due Diligence Platform
            </p>
          </div>

          <p className="absolute bottom-4 text-white/40 text-xs">
            © {new Date().getFullYear()} LexGuard AI. All rights reserved.
          </p>
        </div>

        {/* ── RIGHT: Login form ── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-16 py-16 sm:px-20 lg:px-24">
          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
              Login to your account
            </h2>
            <p className="text-lg text-gray-500 mt-3">
              Enter your credentials to access the platform.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-base mb-8">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-base font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-base font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
              />
              <label htmlFor="remember" className="text-base text-gray-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl text-base font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, hsl(239 84% 62%), hsl(217 91% 60%))" }}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in…
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-400">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Create account */}
          <Link
            to="/register"
            className="flex items-center justify-center w-full py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
