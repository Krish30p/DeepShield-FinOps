import React from 'react';
import { Search, Shield, Lock, Send, CheckCircle2, Server, X } from 'lucide-react';

const PIPELINE_STEPS = [
  { name: "Ingestion Agent", icon: Search, description: "Reading & parsing news data..." },
  { name: "Verification Agent", icon: Shield, description: "Cross-referencing SEC.gov..." },
  { name: "ArmorClaw Middleware", icon: Lock, description: "Enforcing guardrail policies..." },
  { name: "Execution Agent", icon: Send, description: "Sending order to Alpaca..." },
];

export default function PipelineFlow({ activeStep, status, isProcessing }) {
  
  const getStepState = (stepIndex) => {
    const stepNum = stepIndex + 1;
    if (activeStep === 0) return "idle";
    
    // If pending (not reached yet)
    if (stepNum > activeStep) return "pending";

    // If pipeline stopped on this step due to failure
    if (stepNum === activeStep && status === 'blocked') return "failed";

    // If it's the current active step and not failed
    if (stepNum === activeStep && status === 'running') return "active";

    // If passed this step, or if activeStep is 5 (all complete), it's complete
    if (stepNum < activeStep) return "complete";
    
    // Fallback
    return "idle";
  };

  return (
    <div className="bento-card p-6 relative overflow-hidden">
      {isProcessing && (
        <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none transition-opacity duration-500" />
      )}

      <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5 flex items-center gap-2 relative z-10">
        <Server className="w-4 h-4 text-slate-500" />
        Pipeline Flow
        {isProcessing && status === 'running' && (
          <span className="ml-auto text-[10px] text-indigo-400/70 font-medium normal-case tracking-normal" style={{animation: 'subtle-pulse 2s ease-in-out infinite'}}>
            Processing...
          </span>
        )}
        {status === 'success' && activeStep === 5 && (
          <span className="ml-auto text-[10px] text-emerald-400/70 font-medium normal-case tracking-normal">
            ✓ Complete
          </span>
        )}
        {status === 'blocked' && (
          <span className="ml-auto text-[10px] text-rose-400/70 font-medium normal-case tracking-normal">
            ❌ Blocked
          </span>
        )}
      </h3>

      <div className="space-y-1.5 relative z-10">
        {PIPELINE_STEPS.map((step, i) => {
          const state = getStepState(i);
          const StepIcon = step.icon;

          return (
            <div key={i}>
              {/* Connector */}
              {i > 0 && (
                <div className="ml-[11px] -my-0.5">
                  <div className={`w-px h-3 transition-all duration-700 ease-out ${
                    (state === "complete" || state === "active" || state === "failed")
                      ? "bg-indigo-500/30"
                      : "bg-slate-800"
                  }`} />
                </div>
              )}

              {/* Step row */}
              <div className={`pipeline-step-${state} flex items-center gap-3`}>
                {/* Dot */}
                <div className={`pipeline-dot flex items-center justify-center w-6 h-6 rounded-full border-2 text-[10px] font-bold shrink-0 transition-all duration-500 ease-out ${
                  state === "active"
                    ? "border-indigo-500 bg-indigo-500 text-white"
                    : state === "complete"
                    ? "border-emerald-500/50 bg-emerald-500 text-white"
                    : state === "failed"
                    ? "border-red-400 bg-red-500 text-white"
                    : "border-slate-700 bg-slate-800 text-slate-500"
                }`}>
                  {state === "complete" ? "✓" : state === "failed" ? <X className="w-3.5 h-3.5 text-white" /> : i + 1}
                </div>

                {/* Label card */}
                <div className={`pipeline-label flex-1 px-4 py-2.5 rounded-xl border text-sm transition-all duration-500 ease-out ${
                  state === "active"
                    ? "bg-indigo-500/8 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                    : state === "complete"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : state === "failed"
                    ? "bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    : "bg-slate-800/30 border-slate-800/60"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StepIcon className={`w-3.5 h-3.5 transition-colors duration-300 ${
                        state === "active" ? "text-indigo-400" :
                        state === "complete" ? "text-emerald-400" :
                        state === "failed" ? "text-red-400" :
                        "text-slate-600"
                      }`} />
                      <span className={`pipeline-label-text font-medium text-xs transition-colors duration-300 ${
                        state === "active" ? "text-indigo-300" :
                        state === "complete" ? "text-emerald-300/80" :
                        state === "failed" ? "text-red-300/90" :
                        "text-slate-500"
                      }`}>
                        {step.name}
                      </span>
                    </div>

                    {state === "active" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                    )}
                    {state === "complete" && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
                    )}
                  </div>

                  {(state === "active" || state === "failed") && (
                    <p className={`pipeline-status-text text-[10px] mt-1.5 font-medium ${
                      state === "failed" ? "text-red-400/70" : "text-indigo-400/50"
                    }`}>
                      {state === "failed" ? "Process failed at this step." : step.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
