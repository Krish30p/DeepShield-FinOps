import React from "react";
import { X, UserPlus, LogIn, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AuthModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Body */}
        <div className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="inline-flex items-center justify-center p-4 bg-amber-500/15 rounded-2xl border border-amber-500/30">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Free Trials Exhausted</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              You've used all <span className="text-amber-400 font-semibold">3 free guest trials</span>. 
              Create an account to unlock unlimited pipeline executions, historical provenance tracking, and full agent customization.
            </p>
          </div>

          {/* Warning badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">3/3 Trials Used</span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all cursor-pointer border border-slate-600"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
