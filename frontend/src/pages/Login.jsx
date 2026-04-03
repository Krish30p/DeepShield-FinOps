import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/apiPath";
import { Shield, Zap, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    localStorage.setItem("deepshield_guest", "true");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050a14] relative overflow-hidden text-slate-300">
      {/* Ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-900/10 blur-[150px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-slate-800/15 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mb-4 transition-all duration-300 hover:bg-indigo-500/15">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium tracking-wide">DeepShield FinOps Access</p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="bento-card p-8 space-y-5"
        >
          {error && (
            <div className="bg-rose-500/5 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-700/40 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-slate-900/60 transition-all duration-300 ease-out"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-700/40 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-slate-900/60 transition-all duration-300 ease-out"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group btn-press w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 rounded-xl shadow-lg shadow-white/5 transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? "Authenticating..." : (
              <>
                <span>Login Securely</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
              </>
            )}
          </button>

          <p className="text-sm text-center text-slate-500 pt-2 border-b border-slate-800/60 pb-6">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-indigo-400 font-medium cursor-pointer hover:text-indigo-300 transition-colors"
            >
              Register
            </span>
          </p>

          {/* Guest Access Section */}
          <div className="pt-2">
            {canGuest ? (
              <button
                type="button"
                onClick={handleGuestAccess}
                className="group btn-press w-full py-3 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600 text-slate-300 font-medium transition-all duration-300 ease-out flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400/80" />
                <span>Continue as Guest</span>
                <span className="text-[10px] text-slate-500 ml-1 bg-slate-900/50 px-2 py-0.5 rounded-full">
                  {maxTrials - trialCount} left
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 transition-transform duration-300 ease-out group-hover:translate-x-1" />
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-center">
                <p className="text-xs text-orange-400/80 font-medium flex items-center justify-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Guest trials exhausted
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Please login or register to continue.</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
