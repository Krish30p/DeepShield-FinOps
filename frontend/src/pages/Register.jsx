import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL, API_PATHS } from "../utils/apiPath";
import { Shield, UserPlus } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}${API_PATHS.AUTH.REGISTER}`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Optional success check
      if (response.data?.success) {
        navigate("/login");
      } else {
        navigate("/login"); // fallback
      }
    } catch (err) {
      console.error("REGISTER ERROR 👉", err.response?.data || err);
      setError(
        err.response?.data?.message || "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050a14] relative overflow-hidden text-slate-300">
      {/* Ambient glow — very subtle */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-15%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[40%] h-[40%] rounded-full bg-slate-800/20 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mb-4 transition-all duration-300 hover:bg-indigo-500/15">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium tracking-wide">Join DeepShield FinOps</p>
        </div>

        {/* Register Card */}
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
            <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-700/40 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-slate-900/60 transition-all duration-300 ease-out"
              placeholder="John Doe"
            />
          </div>

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
            {loading ? "Registering..." : (
              <>
                <span>Register</span>
                <UserPlus className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
              </>
            )}
          </button>

          <p className="text-sm text-center text-slate-500 mt-6">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-indigo-400 font-medium cursor-pointer hover:text-indigo-300 transition-colors"
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
