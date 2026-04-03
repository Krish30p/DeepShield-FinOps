import React from "react";
import { X, UserPlus, LogIn, ShieldAlert, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AuthModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="modal-backdrop absolute inset-0 bg-[#050a14]/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="modal-content relative w-full max-w-md bento-card overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors duration-300 p-1.5 rounded-lg hover:bg-slate-800 z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500/20 via-rose-500/50 to-orange-500/20" />

        {/* Body */}
        <div className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="inline-flex items-center justify-center p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Access Restricted</h2>
            <p className="text-slate-400 text-sm leading-relaxed px-4">
              Your free guest trials are exhausted. Please log in to unlock unlimited analysis and historical provenance tracking.
            </p>
          </div>

          {/* Warning badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
            </span>
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">3/3 Trials Used</span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/60">
            <button
              onClick={() => navigate("/login")}
              className="group btn-press flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all duration-300 ease-out cursor-pointer border border-slate-700/50"
            >
              <LogIn className="w-4 h-4 text-slate-400" />
              <span className="text-sm">Login</span>
            </button>

            <button
              onClick={() => navigate("/register")}
              className="group btn-press flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-medium shadow-lg shadow-white/5 transition-all duration-300 ease-out cursor-pointer"
            >
              <span className="text-sm">Register</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
