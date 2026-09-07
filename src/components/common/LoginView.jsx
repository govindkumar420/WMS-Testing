import React, { useState, useContext } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import { ShieldCheck, Truck, KeyRound, Smartphone } from 'lucide-react';

export default function LoginView() {
  const { loginUser, settings } = useContext(WmsDataContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // OTP Verification Stage
  const [otpStage, setOtpStage] = useState(false);
  const [otpVal, setOtpVal] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [pendingUser, setPendingUser] = useState(null);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');

    const res = loginUser(username, password);
    if (res.success) {
      if (settings.otpVerify) {
        // Trigger OTP
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(code);
        setPendingUser(res.user);
        setOtpStage(true);
      } else {
        // Direct Login (session already set in loginUser context)
        window.location.reload();
      }
    } else {
      setError(res.message);
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otpVal === generatedOtp || otpVal === '1234') { // Allow 1234 bypass for quick testing
      // Confirm login (session is already saved in context from loginUser step)
      window.location.reload();
    } else {
      setError('Invalid OTP code. Please try again.');
    }
  };

  const autofillUser = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-4xl grid md:grid-cols-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">
        
        {/* Left Side: Brand Banner */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-600 to-teal-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-zinc-900 to-black"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/20">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight block">GNOSIS</span>
              <span className="text-xs uppercase tracking-widest text-emerald-200">Ventures</span>
            </div>
          </div>

          <div className="relative z-10 my-12">
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Fruit & Vegetables WMS</h2>
            <p className="text-sm text-emerald-100 leading-relaxed font-light">
              Enterprise-grade supply chain, cold room monitoring, FIFO/FEFO lot tracking, and end-to-end traceability.
            </p>
          </div>

          <div className="relative z-10 border-t border-white/20 pt-4 flex items-center gap-2 text-xs text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure Role-Based access control active</span>
          </div>
        </div>

        {/* Right Side: Form / OTP Panel */}
        <div className="md:col-span-7 p-8 flex flex-col justify-center">
          {!otpStage ? (
            <div className="w-full max-w-md mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Operation Login</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Enter your credentials to enter the WMS.</p>
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400 rounded-lg p-3 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
                      placeholder="Enter your password"
                    />
                    <KeyRound className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-500 dark:text-zinc-400">
                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300" defaultChecked />
                    Remember me
                  </label>
                  <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:underline">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2 text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  Sign In
                </button>
              </form>

              {/* Demo Accounts Panel */}
              <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <span className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">Demo User Roles (Quick Fill)</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => autofillUser('admin', 'Admin@123')}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                  >
                    Admin <span className="block text-[10px] font-normal text-zinc-400">username: admin</span>
                  </button>
                  <button
                    onClick={() => autofillUser('manager', 'Manager@123')}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                  >
                    Manager <span className="block text-[10px] font-normal text-zinc-400">username: manager</span>
                  </button>
                  <button
                    onClick={() => autofillUser('operator', 'Operator@123')}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                  >
                    GRN Operator <span className="block text-[10px] font-normal text-zinc-400">username: operator</span>
                  </button>
                  <button
                    onClick={() => autofillUser('qc_inspector', 'Qc@123')}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                  >
                    Quality Control <span className="block text-[10px] font-normal text-zinc-400">username: qc_inspector</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full inline-block mb-3">
                  <Smartphone className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Two-Step Verification</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  We've simulated sending a security code to your mobile device.
                </p>
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400 rounded-lg p-3 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-4 mb-5 border border-zinc-200 dark:border-zinc-800 text-center">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 font-semibold">Simulated SMS / OTP Code</span>
                <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-widest">{generatedOtp}</span>
                <span className="block text-[10px] text-zinc-400 mt-1.5">(or enter "1234" to bypass)</span>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpVal}
                    onChange={(e) => setOtpVal(e.target.value)}
                    className="w-full text-center bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-lg font-mono font-semibold text-zinc-900 dark:text-zinc-50 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
                    placeholder="0 0 0 0"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStage(false);
                      setOtpVal('');
                      setError('');
                    }}
                    className="w-1/3 bg-transparent border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg py-2 text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2 text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    Verify Code
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
