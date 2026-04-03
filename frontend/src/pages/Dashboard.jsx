import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, ShieldAlert, Activity, Cpu, Server, CheckCircle2, XOctagon, LogOut, Zap, Lock, Search, Send } from "lucide-react";
import AuthModal from "../components/AuthModal";

// ── Pipeline step metadata ──
const PIPELINE_STEPS = [
  { name: "Ingestion Agent",       icon: Search, description: "Reading & parsing news data..." },
  { name: "Verification Agent",    icon: Shield, description: "Cross-referencing SEC.gov..." },
  { name: "ArmorClaw Middleware",   icon: Lock,   description: "Enforcing guardrail policies..." },
  { name: "Execution Agent",       icon: Send,   description: "Sending order to Alpaca..." },
];

// ── Step timing (milliseconds from trigger) ──
const STEP_DELAYS = [0, 1500, 3000, 4500];
const PIPELINE_COMPLETE_DELAY = 6000; // total animation duration

export default function Dashboard() {
  const navigate = useNavigate();

  // ── Existing state ──
  const [logs, setLogs] = useState([]);
  const [newsInput, setNewsInput] = useState("");
  const [simulationResult, setSimulationResult] = useState(null);

  // ── NEW: Pipeline animation state ──
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState(0); // 0 = idle, 1-4 = step in progress, 5 = all done
  const timeoutsRef = useRef([]);

  // ── Freemium State ──
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [trialCount, setTrialCount] = useState(() => {
    return parseInt(localStorage.getItem("deepshield_trials")) || 0;
  });
  const MAX_TRIALS = 3;

  // ── Fetch audit logs ──
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
      // Cleanup any pending timeouts on unmount
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [fetchLogs]);

  // ── Helper: get CSS class for a pipeline step ──
  const getStepState = (stepIndex) => {
    // stepIndex is 0-based (0..3), activePipelineStep is 1-based (1..4, or 5=done)
    const stepNum = stepIndex + 1;

    if (activePipelineStep === 0) return "idle";        // nothing running
    if (stepNum < activePipelineStep) return "complete"; // already passed
    if (stepNum === activePipelineStep) return "active"; // currently processing
    return "idle";                                       // not yet reached
  };

  // ── The sequential pipeline trigger ──
  const handleTriggerPipeline = async (e) => {
    if (e) e.preventDefault();
    if (!newsInput || isProcessing) return;

    // ── Freemium gate: logged-in users bypass, guests get 3 free runs ──
    if (!isLoggedIn) {
      if (trialCount >= MAX_TRIALS) {
        setShowAuthModal(true);
        return;
      }
      // Increment guest trial count
      const newCount = trialCount + 1;
      setTrialCount(newCount);
      localStorage.setItem("deepshield_trials", newCount.toString());
    }

    // Reset previous results
    setIsProcessing(true);
    setSimulationResult(null);
    setActivePipelineStep(0);

    // Clear any stale timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // ── 1) Kick off the visual sequence ──
    const animationDone = new Promise((resolve) => {
      STEP_DELAYS.forEach((delay, i) => {
        const id = setTimeout(() => {
          setActivePipelineStep(i + 1); // 1, 2, 3, 4
        }, delay);
        timeoutsRef.current.push(id);
      });

      // After all steps animate, mark complete
      const doneId = setTimeout(() => {
        setActivePipelineStep(5);
        resolve();
      }, PIPELINE_COMPLETE_DELAY);
      timeoutsRef.current.push(doneId);
    });

    // ── 2) Simultaneously call the backend ──
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

    // ── 3) Wait for BOTH the animation AND the API to complete ──
    await animationDone;

    // ── 4) Reveal the result ──
    setSimulationResult(apiResult);
    await fetchLogs();
    setNewsInput("");

    // Brief pause on "all complete" before resetting
    const resetId = setTimeout(() => {
      setIsProcessing(false);
      setActivePipelineStep(0);
    }, 1200);
    timeoutsRef.current.push(resetId);
  };



  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-indigo-500/30">
      {/* ── Auth Modal — only shows after trials exhausted ── */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12 bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <Shield className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">DeepShield FinOps</h1>
              <p className="text-indigo-300 text-sm font-medium mt-1">Autonomous Trading &amp; Guardrail System</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold tracking-wider text-emerald-400 uppercase">System Online</span>
            </div>
            
            <button 
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Input Sandbox + Pipeline Flow */}
          <div className="lg:col-span-1 space-y-6">
            {/* ── Data Ingestion Sandbox ── */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] -mr-16 -mt-16 transition-all duration-500 group-hover:bg-indigo-500/20" />
              
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-indigo-400" />
                Data Ingestion Sandbox
              </h2>
              
              <form onSubmit={handleTriggerPipeline}>
                <textarea
                  className="w-full h-32 bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
                  placeholder="Simulate incoming news... e.g., 'AAPL announces huge partnership, buy 50 shares.'"
                  value={newsInput}
                  onChange={(e) => setNewsInput(e.target.value)}
                  disabled={isProcessing}
                />
                
                <button
                  type="submit"
                  disabled={isProcessing || !newsInput.trim()}
                  className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Cpu className="w-5 h-5 animate-spin" />
                      Pipeline Running...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Trigger Analysis Pipeline
                    </>
                  )}
                </button>
              </form>

              {simulationResult && (
                <div className={`mt-6 p-4 rounded-xl border audit-log-enter ${simulationResult.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                  <p className="text-sm font-medium">Result:</p>
                  <p className="text-xs mt-1 opacity-90">{simulationResult.type === 'success' ? simulationResult.data.message : simulationResult.data.reason || simulationResult.data.error}</p>
                </div>
              )}
            </div>

            {/* ── Pipeline Flow (Animated Steps) ── */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl relative overflow-hidden">
              {/* Glow effect when processing */}
              {isProcessing && (
                <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
              )}

              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5 flex items-center gap-2 relative z-10">
                <Server className="w-4 h-4 text-slate-400" />
                Pipeline Flow
                {isProcessing && (
                  <span className="ml-auto text-xs text-indigo-400 font-normal normal-case tracking-normal animate-pulse">
                    Processing...
                  </span>
                )}
                {activePipelineStep === 5 && (
                  <span className="ml-auto text-xs text-emerald-400 font-normal normal-case tracking-normal">
                    ✓ Complete
                  </span>
                )}
              </h3>

              <div className="space-y-1 relative z-10">
                {PIPELINE_STEPS.map((step, i) => {
                  const state = getStepState(i);
                  const StepIcon = step.icon;

                  return (
                    <div key={i} className="relative">
                      {/* Connector line between steps */}
                      {i > 0 && (
                        <div className="flex justify-start ml-[11px] -mt-1 -mb-1">
                          <div
                            className={`w-0.5 h-4 transition-all duration-500 ${
                              state === "complete" || state === "active"
                                ? "bg-gradient-to-b from-emerald-500/60 to-indigo-400/60"
                                : "bg-slate-700/50"
                            }`}
                          />
                        </div>
                      )}

                      {/* Step row */}
                      <div className={`pipeline-step-${state} flex items-center gap-3 group/step`}>
                        {/* Number dot */}
                        <div
                          className={`pipeline-dot flex items-center justify-center w-6 h-6 rounded-full border-[3px] text-xs font-bold shrink-0 transition-all duration-500 ${
                            state === "active"
                              ? "border-indigo-400 bg-indigo-500 text-white"
                              : state === "complete"
                              ? "border-slate-900 bg-emerald-500 text-white"
                              : "border-slate-900 bg-slate-700 text-slate-400"
                          }`}
                        >
                          {state === "complete" ? "✓" : i + 1}
                        </div>

                        {/* Label card */}
                        <div
                          className={`pipeline-label flex-1 px-4 py-3 rounded-xl border text-sm transition-all duration-500 ${
                            state === "active"
                              ? "bg-indigo-500/15 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                              : state === "complete"
                              ? "bg-emerald-500/8 border-emerald-500/30"
                              : "bg-slate-900/50 border-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StepIcon className={`w-4 h-4 transition-colors duration-300 ${
                                state === "active"
                                  ? "text-indigo-400"
                                  : state === "complete"
                                  ? "text-emerald-400"
                                  : "text-slate-500"
                              }`} />
                              <span className={`pipeline-label-text font-medium transition-colors duration-300 ${
                                state === "active"
                                  ? "text-indigo-200"
                                  : state === "complete"
                                  ? "text-emerald-300"
                                  : "text-slate-400"
                              }`}>
                                {step.name}
                              </span>
                            </div>

                            {state === "active" && (
                              <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                            )}
                            {state === "complete" && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>

                          {/* Active step description */}
                          {state === "active" && (
                            <p className="pipeline-status-text text-xs text-indigo-300/80 mt-1.5 animate-pulse">
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

          {/* Right Column: Execution Audit Log */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl h-[calc(100vh-12rem)] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/60 z-10 relative">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                  Live Audit Log &amp; Provenance
                </h2>
                <div className="text-xs text-slate-400 animate-pulse">Syncing...</div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                    <Activity className="w-12 h-12 opacity-20" />
                    <p>Awaiting pipeline execution events...</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div 
                      key={log._id} 
                      className={`audit-log-enter relative overflow-hidden p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                        log.status === 'EXECUTED' 
                          ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-900/20'
                          : log.status === 'BLOCKED' || log.status === 'FAILED'
                          ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/40 hover:shadow-rose-900/20'
                          : 'bg-slate-800/30 border-slate-700/50'
                      }`}
                    >
                      {/* Left status color accent */}
                      <div className={`absolute top-0 left-0 w-1 h-full ${
                        log.status === 'EXECUTED' ? 'bg-emerald-500' :
                        log.status === 'BLOCKED' || log.status === 'FAILED' ? 'bg-rose-500' : 'bg-slate-500'
                      }`} />

                      <div className="flex justify-between items-start mb-3 pl-2">
                        <div className="flex items-center gap-3">
                          {log.status === 'EXECUTED' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                          {log.status === 'BLOCKED' && <XOctagon className="w-5 h-5 text-rose-500" />}
                          {(log.status === 'PENDING' || log.status === 'FAILED') && <ShieldAlert className="w-5 h-5 text-slate-500" />}
                          
                          <div>
                            <span className="text-sm font-bold text-white block">Alpaca Agent</span>
                            <span className="text-xs text-slate-400 block">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border space-x-1 ${
                          log.status === 'EXECUTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          log.status === 'BLOCKED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </div>

                      <div className="pl-2 space-y-2 text-sm max-w-full">
                        {log.asset && (
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-xs text-indigo-300 font-bold bg-indigo-500/10 px-2 py-1 rounded">
                                {log.action} {log.asset}
                              </span>
                              <span className="text-slate-300 font-mono text-xs">Qty: {log.quantity}</span>
                            </div>
                          </div>
                        )}
                        
                        {log.status === 'BLOCKED' && log.block_reason && (
                          <div className="mt-3 text-rose-400 text-xs font-medium flex items-start gap-2 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                            <span className="mt-0.5">⚠️</span>
                            <span>{log.block_reason}</span>
                          </div>
                        )}
                        
                        {log.verification_provenance && (
                          <div className="text-xs mt-2 truncate max-w-full flex items-center gap-2">
                            <span className="text-slate-500 shrink-0">Provenance:</span> 
                            <a href="#" className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline truncate">
                              {log.verification_provenance}
                            </a>
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
