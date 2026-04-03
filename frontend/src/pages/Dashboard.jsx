import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, ShieldAlert, Activity, Cpu, Server, CheckCircle2, XOctagon, LogOut, Zap, Lock, Search, Send, ArrowRight } from "lucide-react";
import AuthModal from "../components/AuthModal";

const PIPELINE_STEPS = [
  { name: "Ingestion Agent", icon: Search, description: "Reading & parsing news data..." },
  { name: "Verification Agent", icon: Shield, description: "Cross-referencing SEC.gov..." },
  { name: "ArmorClaw Middleware", icon: Lock, description: "Enforcing guardrail policies..." },
  { name: "Execution Agent", icon: Send, description: "Sending order to Alpaca..." },
];

const STEP_DELAYS = [0, 1500, 3000, 4500];
const PIPELINE_COMPLETE_DELAY = 6000;

export default function Dashboard() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [newsInput, setNewsInput] = useState("");
  const [simulationResult, setSimulationResult] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState(0);
  const timeoutsRef = useRef([]);

  // Freemium
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [trialCount, setTrialCount] = useState(() => {
    return parseInt(localStorage.getItem("deepshield_trials")) || 0;
  });
  const MAX_TRIALS = 3;

  const fetchLogs = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/logs");
      setLogs(response.data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => {
      clearInterval(interval);
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [fetchLogs]);

  const getStepState = (stepIndex) => {
    const stepNum = stepIndex + 1;
    if (activePipelineStep === 0) return "idle";
    if (stepNum < activePipelineStep) return "complete";
    if (stepNum === activePipelineStep) return "active";
    return "idle";
  };

  const handleTriggerPipeline = async (e) => {
    if (e) e.preventDefault();
    if (!newsInput || isProcessing) return;

    if (!isLoggedIn) {
      if (trialCount >= MAX_TRIALS) {
        setShowAuthModal(true);
        return;
      }
      const newCount = trialCount + 1;
      setTrialCount(newCount);
      localStorage.setItem("deepshield_trials", newCount.toString());
    }

    setIsProcessing(true);
    setSimulationResult(null);
    setActivePipelineStep(0);

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const animationDone = new Promise((resolve) => {
      STEP_DELAYS.forEach((delay, i) => {
        const id = setTimeout(() => setActivePipelineStep(i + 1), delay);
        timeoutsRef.current.push(id);
      });
      const doneId = setTimeout(() => {
        setActivePipelineStep(5);
        resolve();
      }, PIPELINE_COMPLETE_DELAY);
      timeoutsRef.current.push(doneId);
    });

    let apiResult;
    try {
      const response = await axios.post("http://localhost:4000/api/trigger-analysis", {
        newsText: newsInput,
      });
      apiResult = { type: "success", data: response.data };
    } catch (error) {
      apiResult = {
        type: "error",
        data: error.response?.data || { message: "Network Error" },
      };
    }

    await animationDone;

    setSimulationResult(apiResult);
    await fetchLogs();
    setNewsInput("");

    const resetId = setTimeout(() => {
      setIsProcessing(false);
      setActivePipelineStep(0);
    }, 1200);
    timeoutsRef.current.push(resetId);
  };

  return (
    <div className="min-h-screen bg-[#050a14] text-slate-300 selection:bg-indigo-500/20">
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Ambient glow — very subtle */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[40%] h-[40%] rounded-full bg-slate-800/20 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <header className="bento-card flex items-center justify-between mb-10 p-5">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 transition-all duration-300 hover:bg-indigo-500/15">
              <Shield className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">DeepShield FinOps</h1>
              <p className="text-slate-500 text-xs font-medium mt-0.5 tracking-wide">Autonomous Trading & Guardrail System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Online indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">Online</span>
            </div>

            {/* Guest trial badge */}
            {!isLoggedIn && (
              <span className="trial-badge">
                {trialCount}/{MAX_TRIALS} trials
              </span>
            )}

            <button 
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="group btn-press flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-lg border border-slate-700/40 transition-all duration-300 ease-out cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
              <span className="text-xs font-medium">Logout</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column ── */}
          <div className="lg:col-span-1 space-y-6">

            {/* Data Ingestion Sandbox */}
            <div className="bento-card p-6">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-indigo-400" />
                Data Ingestion Sandbox
              </h2>
              
              <form onSubmit={handleTriggerPipeline}>
                <textarea
                  className="w-full h-28 bg-slate-900/40 border border-slate-700/40 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-slate-900/60 resize-none transition-all duration-300 ease-out"
                  placeholder="Paste financial news... e.g., 'AAPL announces huge partnership, buy 50 shares.'"
                  value={newsInput}
                  onChange={(e) => setNewsInput(e.target.value)}
                  disabled={isProcessing}
                />
                
                {/* Tactile trigger button with sliding arrow */}
                <button
                  type="submit"
                  disabled={isProcessing || !newsInput.trim()}
                  className="group btn-press mt-4 w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all duration-300 ease-out disabled:opacity-30 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Cpu className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Pipeline Running...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">Trigger Analysis Pipeline</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Result feedback */}
              {simulationResult && (
                <div className={`audit-log-enter mt-5 p-4 rounded-xl border ${simulationResult.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1">Result</p>
                  <p className="text-xs opacity-80">{simulationResult.type === 'success' ? simulationResult.data.message : simulationResult.data.reason || simulationResult.data.error}</p>
                </div>
              )}
            </div>

            {/* Pipeline Flow */}
            <div className="bento-card p-6 relative overflow-hidden">
              {isProcessing && (
                <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none transition-opacity duration-500" />
              )}

              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5 flex items-center gap-2 relative z-10">
                <Server className="w-4 h-4 text-slate-500" />
                Pipeline Flow
                {isProcessing && (
                  <span className="ml-auto text-[10px] text-indigo-400/70 font-medium normal-case tracking-normal" style={{animation: 'subtle-pulse 2s ease-in-out infinite'}}>
                    Processing...
                  </span>
                )}
                {activePipelineStep === 5 && (
                  <span className="ml-auto text-[10px] text-emerald-400/70 font-medium normal-case tracking-normal">
                    ✓ Complete
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
                            state === "complete" || state === "active"
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
                            : "border-slate-700 bg-slate-800 text-slate-500"
                        }`}>
                          {state === "complete" ? "✓" : i + 1}
                        </div>

                        {/* Label card */}
                        <div className={`pipeline-label flex-1 px-4 py-2.5 rounded-xl border text-sm transition-all duration-500 ease-out ${
                          state === "active"
                            ? "bg-indigo-500/8 border-indigo-500/30"
                            : state === "complete"
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : "bg-slate-800/30 border-slate-800/60"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StepIcon className={`w-3.5 h-3.5 transition-colors duration-300 ${
                                state === "active" ? "text-indigo-400" :
                                state === "complete" ? "text-emerald-400" :
                                "text-slate-600"
                              }`} />
                              <span className={`pipeline-label-text font-medium text-xs transition-colors duration-300 ${
                                state === "active" ? "text-indigo-300" :
                                state === "complete" ? "text-emerald-300/80" :
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

                          {state === "active" && (
                            <p className="pipeline-status-text text-[10px] text-indigo-400/50 mt-1.5 font-medium">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right Column: Audit Log ── */}
          <div className="lg:col-span-2">
            <div className="bento-card h-[calc(100vh-12rem)] flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-800/60 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  Live Audit Log
                </h2>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Syncing</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                    <Activity className="w-10 h-10 opacity-15" />
                    <p className="text-xs">Awaiting pipeline execution events...</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div 
                      key={log._id} 
                      className={`audit-log-enter group cursor-pointer relative overflow-hidden p-4 rounded-xl border transition-all duration-300 ease-out hover:translate-y-[-2px] ${
                        log.status === 'EXECUTED' 
                          ? 'bg-slate-900/30 border-slate-800/60 hover:border-emerald-500/25'
                          : log.status === 'BLOCKED' || log.status === 'FAILED'
                          ? 'bg-slate-900/30 border-slate-800/60 hover:border-rose-500/25'
                          : 'bg-slate-900/30 border-slate-800/60'
                      }`}
                    >
                      {/* Left accent — very thin */}
                      <div className={`absolute top-0 left-0 w-0.5 h-full transition-all duration-300 ${
                        log.status === 'EXECUTED' ? 'bg-emerald-500/50 group-hover:bg-emerald-500' :
                        log.status === 'BLOCKED' || log.status === 'FAILED' ? 'bg-rose-500/50 group-hover:bg-rose-500' : 'bg-slate-700'
                      }`} />

                      <div className="flex justify-between items-start mb-2.5 pl-3">
                        <div className="flex items-center gap-2.5">
                          {log.status === 'EXECUTED' && <CheckCircle2 className="w-4 h-4 text-emerald-500/70 transition-colors group-hover:text-emerald-400" />}
                          {log.status === 'BLOCKED' && <XOctagon className="w-4 h-4 text-rose-500/70 transition-colors group-hover:text-rose-400" />}
                          {(log.status === 'PENDING' || log.status === 'FAILED') && <ShieldAlert className="w-4 h-4 text-slate-600" />}
                          
                          <div>
                            <span className="text-xs font-semibold text-slate-300 block transition-colors group-hover:text-white">Alpaca Agent</span>
                            <span className="text-[10px] text-slate-600 block">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border transition-all duration-300 ${
                          log.status === 'EXECUTED' ? 'bg-emerald-500/5 text-emerald-500/70 border-emerald-500/15 group-hover:text-emerald-400' :
                          log.status === 'BLOCKED' ? 'bg-rose-500/5 text-rose-500/70 border-rose-500/15 group-hover:text-rose-400' :
                          'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                          {log.status}
                        </span>
                      </div>

                      <div className="pl-3 space-y-2 text-sm max-w-full">
                        {log.asset && (
                          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50 flex items-center gap-3">
                            <span className="font-mono text-[10px] text-indigo-300/70 font-semibold bg-indigo-500/8 px-2 py-0.5 rounded">
                              {log.action} {log.asset}
                            </span>
                            <span className="text-slate-500 font-mono text-[10px]">Qty: {log.quantity}</span>
                          </div>
                        )}
                        
                        {log.status === 'BLOCKED' && log.block_reason && (
                          <div className="text-rose-400/70 text-[10px] font-medium flex items-start gap-2 bg-rose-500/5 p-2.5 rounded-lg border border-rose-500/10">
                            <span>⚠️</span>
                            <span>{log.block_reason}</span>
                          </div>
                        )}
                        
                        {log.verification_provenance && (
                          <div className="text-[10px] truncate max-w-full flex items-center gap-2">
                            <span className="text-slate-600 shrink-0">Provenance:</span> 
                            <span className="font-mono text-indigo-400/50 truncate">{log.verification_provenance}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
