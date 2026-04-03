import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/apiPath";
import { Shield, LogIn, UserPlus, Zap } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check trial count from localStorage
  const trialCount = parseInt(localStorage.getItem("deepshield_trials")) || 0;
  const maxTrials = 3;
  const canGuest = trialCount < maxTrials;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        formData
      );

      // Save token
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      console.log("LOGIN ERROR 👉", err.response?.data || err);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    // Mark as guest in localStorage so Dashboard knows
    localStorage.setItem("deepshield_guest", "true");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-600/15 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-500/20 rounded-2xl mb-4 border border-indigo-500/30">
            <Shield className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">DeepShield FinOps</h1>
          <p className="text-slate-400 text-sm mt-2">Autonomous Trading & Guardrail System</p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-slate-700/50 shadow-2xl space-y-5"
        >
          <h2 className="text-xl font-semibold text-white text-center flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5 text-indigo-400" />
            Welcome Back
          </h2>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-sm text-center text-slate-400">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-indigo-400 font-medium cursor-pointer hover:text-indigo-300 hover:underline transition-colors"
            >
              Register
            </span>
          </p>

          {/* ── Continue as Guest ── Only shown if trials < 3 */}
          {canGuest && (
            <>
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-500 uppercase">or</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>

              <button
                type="button"
                onClick={handleGuestAccess}
                className="w-full py-3 rounded-xl border-2 border-dashed border-slate-600 text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/5 font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                Continue as Guest
                <span className="text-xs text-slate-500 ml-1">({maxTrials - trialCount} free trials)</span>
              </button>
            </>
          )}

          {/* Show message if trials exhausted */}
          {!canGuest && (
            <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-xs text-amber-400">
                Guest trials exhausted. Please login or register to continue.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
