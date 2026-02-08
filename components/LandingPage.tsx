import React from 'react';
import { BookOpen, BarChart3, Shield, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* Animated Background Grid */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-emerald-500 opacity-10 blur-[100px]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-5 h-5 text-white" />
           </div>
           <span className="text-xl font-bold tracking-tight text-white">QuantJournal</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogin}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </button>
          <button 
            onClick={onRegister}
            className="text-sm font-medium bg-white text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
           v2.0 Now Live: Enhanced Analytics
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Master Your Edge with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Professional Analytics</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Stop trading in the dark. QuantJournal provides the metrics, equity curves, and psychological insights you need to scale from discretionary trader to professional fund manager.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
           <button 
            onClick={onRegister}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-indigo-500/20"
           >
             Start Journaling Free <ArrowRight className="w-5 h-5" />
           </button>
           <button 
            onClick={onLogin}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-8 py-4 rounded-xl font-bold text-lg transition-all"
           >
             Live Demo
           </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full text-left">
           <div className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 transition-colors">
              <div className="w-12 h-12 bg-indigo-900/50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                 <BarChart3 className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Deep Analytics</h3>
              <p className="text-slate-400 text-sm">Automated equity curves, drawdown analysis, and expectancy calculations calculated in real-time.</p>
           </div>
           
           <div className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 bg-emerald-900/50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                 <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Risk Guard</h3>
              <p className="text-slate-400 text-sm">Define your risk rules. We'll automatically flag trades that violate your daily loss limits or risk-per-trade.</p>
           </div>

           <div className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                 <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Setup</h3>
              <p className="text-slate-400 text-sm">Import your history or start logging manually in seconds. Supports Forex, Crypto, Indices, and Stocks.</p>
           </div>
        </div>

        {/* Social Proof / Trusted By */}
        <div className="mt-24 pt-10 border-t border-slate-800/50 w-full">
            <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Trusted by 2,000+ Pro Traders</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Mock Logos */}
               <div className="text-xl font-bold font-mono">APEX<span className="text-indigo-500">TRADER</span></div>
               <div className="text-xl font-bold font-mono">FTMO<span className="text-emerald-500">_READY</span></div>
               <div className="text-xl font-bold font-mono">TOP<span className="text-rose-500">STEP</span></div>
               <div className="text-xl font-bold font-mono">DARWIN<span className="text-purple-500">EX</span></div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;