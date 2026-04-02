import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, ShieldAlert, Activity, Cpu, Server, CheckCircle2, XOctagon, LogOut } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [newsInput, setNewsInput] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const fetchLogs = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/audit-logs");
      setLogs(response.data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!newsInput) return;
    
    setIsSimulating(true);
    setSimulationResult(null);

    try {
      const response = await axios.post("http://localhost:4000/api/trigger-analysis", {
        newsText: newsInput
      });
      setSimulationResult({ type: "success", data: response.data });
      fetchLogs();
      setNewsInput("");
    } catch (error) {
      setSimulationResult({ type: "error", data: error.response?.data || { message: "Network Error" } });
      fetchLogs();
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-indigo-500/30">
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
              <p className="text-indigo-300 text-sm font-medium mt-1">Autonomous Trading & Guardrail System</p>
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
          {/* Left Column: Input Sandbox */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] -mr-16 -mt-16 transition-all duration-500 group-hover:bg-indigo-500/20" />
              
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-indigo-400" />
                Data Ingestion Sandbox
              </h2>
              
              <form onSubmit={handleSimulate}>
                <textarea
                  className="w-full h-32 bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
                  placeholder="Simulate incoming news... e.g., 'AAPL announces huge partnership, buy 50 shares.'"
                  value={newsInput}
                  onChange={(e) => setNewsInput(e.target.value)}
                />
                
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSimulating ? (
                    <>
                      <Cpu className="w-5 h-5 animate-spin" />
                      Analyzing Payload...
                    </>
                  ) : (
                    "Trigger Analysis Pipeline"
                  )}
                </button>
              </form>

              {simulationResult && (
                <div className={`mt-6 p-4 rounded-xl border ${simulationResult.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'} animate-in fade-in slide-in-from-bottom-2`}>
                  <p className="text-sm font-medium">Result:</p>
                  <p className="text-xs mt-1 opacity-90">{simulationResult.type === 'success' ? simulationResult.data.message : simulationResult.data.reason || simulationResult.data.error}</p>
                </div>
              )}
            </div>

            {/* Architecture Explainer */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                Pipeline Flow
              </h3>
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                {["Ingestion Agent", "Verification Agent", "ArmorClaw Middleware", "Execution Agent"].map((agent, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-slate-900 bg-slate-700 text-slate-400 z-10 font-bold text-xs">
                        {i + 1}
                     </div>
                     <div className="ml-4 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/50 text-xs font-medium w-full shadow-sm">
                        {agent}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Execution Audit Log */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl h-[calc(100vh-12rem)] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/60 z-10 relative">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                  Live Audit Log & Provenance
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
                      className={`relative overflow-hidden p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                        log.status === 'Executed' || log.status === 'Allowed'
                          ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-900/20'
                          : log.status === 'Blocked' || log.status === 'Failed'
                          ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/40 hover:shadow-rose-900/20'
                          : 'bg-slate-800/30 border-slate-700/50'
                      }`}
                    >
                      {/* Left status color accent */}
                      <div className={`absolute top-0 left-0 w-1 h-full ${
                        log.status === 'Executed' || log.status === 'Allowed' ? 'bg-emerald-500' :
                        log.status === 'Blocked' || log.status === 'Failed' ? 'bg-rose-500' : 'bg-slate-500'
                      }`} />

                      <div className="flex justify-between items-start mb-3 pl-2">
                        <div className="flex items-center gap-3">
                          {log.status === 'Executed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                          {log.status === 'Blocked' && <XOctagon className="w-5 h-5 text-rose-500" />}
                          {(log.status === 'Pending' || log.status === 'Failed') && <ShieldAlert className="w-5 h-5 text-slate-500" />}
                          
                          <div>
                            <span className="text-sm font-bold text-white block">{log.agent}</span>
                            <span className="text-xs text-slate-400 block">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border space-x-1 ${
                          log.status === 'Executed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          log.status === 'Blocked' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </div>

                      <div className="pl-2 space-y-2 text-sm max-w-full">
                        {log.intent_payload && log.intent_payload.ticker && (
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-xs text-indigo-300 font-bold bg-indigo-500/10 px-2 py-1 rounded">
                                {log.intent_payload.action} {log.intent_payload.ticker}
                              </span>
                              <span className="text-slate-300 font-mono text-xs">Qty: {log.intent_payload.quantity}</span>
                            </div>
                            <span className="text-slate-500 text-xs max-w-[40%] truncate" title={log.intent_payload.rationale}>
                              {log.intent_payload.rationale}
                            </span>
                          </div>
                        )}
                        
                        {log.status === 'Blocked' && log.block_reason && (
                          <div className="mt-3 text-rose-400 text-xs font-medium flex items-start gap-2 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                            <span className="mt-0.5">⚠️</span>
                            <span>{log.block_reason}</span>
                          </div>
                        )}
                        
                        {log.intent_payload && log.intent_payload.verification_provenance && (
                          <div className="text-xs mt-2 truncate max-w-full flex items-center gap-2">
                            <span className="text-slate-500 shrink-0">Provenance:</span> 
                            <a href="#" className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline truncate">
                              {log.intent_payload.verification_provenance}
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
