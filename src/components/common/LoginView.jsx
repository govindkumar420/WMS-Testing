import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  ShieldCheck,
  Truck,
  KeyRound,
  Smartphone,
  Sparkles,
  ArrowRight,
  Shield,
  Key,
  Mail,
  RotateCw,
  ArrowLeft,
  LifeBuoy,
  Lock,
  Clock,
  Check,
  Copy
} from 'lucide-react';
import { generateTotp, getTotpRemainingSeconds } from '../../utils/totp';

export default function LoginView() {
  const {
    loginDirectly,
    verifyCredentials,
    confirmTwoFactorLogin
  } = useContext(WmsDataContext);

  // Credentials State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // 2FA Stage State
  const [stage2fa, setStage2fa] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null); // { user, method, secret, requires2fa }
  const [selectedMethod, setSelectedMethod] = useState('totp'); // 'totp' | 'sms' | 'email' | 'backup'

  // 6-Digit PIN State for 2FA
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const pinInputRefs = useRef([]);

  // Backup Code State
  const [backupCodeVal, setBackupCodeVal] = useState('');

  // Simulated OTP & Live TOTP States
  const [liveTotpCode, setLiveTotpCode] = useState('');
  const [totpSecondsLeft, setTotpSecondsLeft] = useState(30);
  const [simulatedSmsCode, setSimulatedSmsCode] = useState('');
  const [simulatedEmailCode, setSimulatedEmailCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Update Live TOTP and countdown timer
  useEffect(() => {
    let timer;
    if (stage2fa && pendingAuth?.secret && (selectedMethod === 'totp' || selectedMethod === 'sms' || selectedMethod === 'email')) {
      const updateCode = async () => {
        try {
          const code = await generateTotp(pendingAuth.secret);
          setLiveTotpCode(code);
          setTotpSecondsLeft(getTotpRemainingSeconds(30));
        } catch (e) {
          console.warn('TOTP compute error:', e);
        }
      };

      updateCode();
      timer = setInterval(() => {
        const remaining = getTotpRemainingSeconds(30);
        setTotpSecondsLeft(remaining);
        if (remaining === 30 || remaining === 29) {
          updateCode();
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage2fa, pendingAuth, selectedMethod]);

  // Resend cooldown timer for SMS/Email
  useEffect(() => {
    let cdTimer;
    if (resendCooldown > 0) {
      cdTimer = setInterval(() => {
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(cdTimer);
  }, [resendCooldown]);

  // Dispatch Simulated SMS/Email Code
  const dispatchSimulatedCode = useCallback((methodType) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    if (methodType === 'sms') {
      setSimulatedSmsCode(code);
    } else if (methodType === 'email') {
      setSimulatedEmailCode(code);
    }
    setResendCooldown(45);
  }, []);

  // Handle Primary Credentials Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const res = verifyCredentials(username, password);
      if (res.success) {
        if (res.requires2fa) {
          setPendingAuth(res);
          const initialMethod = res.method || 'totp';
          setSelectedMethod(initialMethod);
          setStage2fa(true);
          setPinDigits(['', '', '', '', '', '']);
          setBackupCodeVal('');

          if (initialMethod === 'sms') {
            dispatchSimulatedCode('sms');
          } else if (initialMethod === 'email') {
            dispatchSimulatedCode('email');
          }
        }
      } else {
        setError(res.message || 'Invalid username or password');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 6-digit PIN Box Handlers
  const handlePinChange = (index, value) => {
    // Only accept numeric input
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...pinDigits];
    newDigits[index] = char;
    setPinDigits(newDigits);

    // Auto-advance to next input if filled
    if (char && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    const completeCode = newDigits.join('');
    if (completeCode.length === 6) {
      handleFinalize2fa(completeCode, selectedMethod, false);
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      const digits = paste.split('');
      setPinDigits(digits);
      pinInputRefs.current[5]?.focus();
      handleFinalize2fa(paste, selectedMethod, false);
    } else if (/^\d{4}$/.test(paste)) {
      const digits = [...paste.split(''), '', ''];
      setPinDigits(digits);
      handleFinalize2fa(paste, selectedMethod, false);
    }
  };

  // Finalize 2FA Login
  const handleFinalize2fa = async (code, method, isBackup = false) => {
    setError('');
    setIsVerifying(true);
    try {
      const targetUser = pendingAuth?.user?.username || username;
      const res = await confirmTwoFactorLogin(targetUser, code, method, isBackup);
      if (!res.success) {
        setError(res.message || 'Invalid verification code. Please try again.');
        setPinDigits(['', '', '', '', '', '']);
        pinInputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handle2faFormSubmit = (e) => {
    e.preventDefault();
    if (selectedMethod === 'backup') {
      if (!backupCodeVal.trim()) {
        setError('Please enter your 8-character recovery code.');
        return;
      }
      handleFinalize2fa(backupCodeVal.trim(), 'backup', true);
    } else {
      const code = pinDigits.join('');
      if (code.length < 4) {
        setError('Please enter the 6-digit security verification code.');
        return;
      }
      handleFinalize2fa(code, selectedMethod, false);
    }
  };

  const handleCopyAndFill = (codeToFill) => {
    if (!codeToFill) return;
    navigator.clipboard.writeText(codeToFill);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);

    const digits = codeToFill.slice(0, 6).split('');
    while (digits.length < 6) digits.push('');
    setPinDigits(digits);
    handleFinalize2fa(codeToFill, selectedMethod, false);
  };

  const handleDirectDemo = (user = 'admin') => {
    if (loginDirectly) {
      loginDirectly(user);
    }
  };

  const autofillUser = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-4xl grid md:grid-cols-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in-50 duration-300">

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

          <div className="relative z-10 my-10">
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Fruit & Vegetables WMS</h2>
            <p className="text-sm text-emerald-100 leading-relaxed font-light">
              Enterprise supply chain operations with RFC 6238 Two-Factor Authentication, cold storage telemetry, and lot traceability.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 text-xs text-emerald-100/90 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300 shrink-0" />
                <span>2FA Authenticator & SMS Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-300 shrink-0" />
                <span>Single-Use Emergency Recovery Codes</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-300 shrink-0" />
                <span>Role-Based Multi-Hub Access Control</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/20 pt-4 flex items-center gap-2 text-xs text-emerald-200">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Multi-Factor Authentication (2FA) Active</span>
          </div>
        </div>

        {/* Right Side: Primary Login or 2FA Challenge */}
        <div className="md:col-span-7 p-8 flex flex-col justify-center">
          {!stage2fa ? (
            /* ========================================================================= */
            /* STAGE 1: PRIMARY CREDENTIALS (USERNAME & PASSWORD) */
            /* ========================================================================= */
            <div className="w-full max-w-md mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Operation Login</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Enter your credentials to access the WMS platform.</p>
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400 rounded-xl p-3 text-xs flex items-center gap-2">
                  <KeyRound className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
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
                    className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
                    placeholder="Enter username (e.g. admin)"
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
                      className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
                      placeholder="Enter password"
                    />
                    <KeyRound className="absolute right-3.5 top-3 h-4 w-4 text-zinc-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-500 dark:text-zinc-400 text-xs">
                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300" defaultChecked />
                    Remember session
                  </label>
                  <span className="text-zinc-400 text-[11px]">Protected by 2FA Shield</span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-xl py-2.5 text-xs transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <RotateCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Continue to Verification</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectDemo('admin')}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold rounded-xl py-2 text-xs transition-colors shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>⚡ Quick Launch as Admin (Instant Bypass)</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </form>

              {/* Demo Accounts Panel */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                  Test Accounts (2FA Configured)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => autofillUser('admin', 'Admin@123')}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                      <span>Admin</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">TOTP 2FA</span>
                    </div>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">admin / Admin@123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => autofillUser('manager', 'Manager@123')}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                      <span>Manager</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono">SMS 2FA</span>
                    </div>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">manager / Manager@123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => autofillUser('operator', 'Operator@123')}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <span className="font-semibold block text-zinc-900 dark:text-zinc-100">GRN Operator</span>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">operator / Operator@123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => autofillUser('qc_inspector', 'Qc@123')}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <span className="font-semibold block text-zinc-900 dark:text-zinc-100">Quality Control</span>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">qc_inspector / Qc@123</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* STAGE 2: TWO-FACTOR AUTHENTICATION CHALLENGE */
            /* ========================================================================= */
            <div className="w-full max-w-md mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">

              {/* Header */}
              <div className="text-center">
                <div className="relative inline-block mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                    {selectedMethod === 'totp' && <Shield className="h-6 w-6" />}
                    {selectedMethod === 'sms' && <Smartphone className="h-6 w-6" />}
                    {selectedMethod === 'email' && <Mail className="h-6 w-6" />}
                    {selectedMethod === 'backup' && <Key className="h-6 w-6" />}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] text-white items-center justify-center font-bold">✓</span>
                  </span>
                </div>

                <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Two-Factor Authentication</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Verifying identity for <strong className="text-zinc-800 dark:text-zinc-200 font-mono font-semibold">{pendingAuth?.user?.username}</strong> ({pendingAuth?.user?.role})
                </p>
              </div>

              {/* Method Switcher Tabs */}
              <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('totp');
                    setError('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${selectedMethod === 'totp'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Authenticator</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('sms');
                    setError('');
                    if (!simulatedSmsCode) dispatchSimulatedCode('sms');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${selectedMethod === 'sms'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>SMS OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('backup');
                    setError('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${selectedMethod === 'backup'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>Backup Code</span>
                </button>
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400 rounded-xl p-3 text-xs text-center font-medium">
                  {error}
                </div>
              )}

              {/* Dynamic Live Helper / Simulated Dispatch Preview */}
              {selectedMethod === 'totp' && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-600" />
                      Live TOTP (RFC 6238)
                    </span>
                    <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                      <span>Expires in:</span>
                      <span className="font-bold">{totpSecondsLeft}s</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-[#0c0c0f] border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-2">
                    <span className="font-mono text-base font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                      {liveTotpCode || '••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAndFill(liveTotpCode)}
                      className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCode ? 'Filled!' : 'Quick Fill'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Use any 6-digit code from Google / Microsoft Authenticator or click Quick Fill.
                  </p>
                </div>
              )}

              {selectedMethod === 'sms' && (
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/40 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                      Simulated SMS to {pendingAuth?.user?.phoneNumber || '+91 98765 43210'}
                    </span>
                    <button
                      type="button"
                      onClick={() => dispatchSimulatedCode('sms')}
                      disabled={resendCooldown > 0}
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-[#0c0c0f] border border-blue-200 dark:border-blue-800/60 rounded-lg p-2">
                    <span className="font-mono text-base font-bold tracking-widest text-blue-600 dark:text-blue-400">
                      {simulatedSmsCode || '123456'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAndFill(simulatedSmsCode || '123456')}
                      className="px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCode ? 'Filled!' : 'Quick Fill'}</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod === 'backup' && (
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-xl p-3 text-xs space-y-1.5">
                  <span className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                    <LifeBuoy className="h-3.5 w-3.5 text-amber-600" />
                    Emergency Single-Use Recovery Code
                  </span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-normal">
                    Enter one of the 8-character single-use emergency backup codes provided during 2FA setup.
                  </p>
                </div>
              )}

              {/* 2FA Form Inputs */}
              <form onSubmit={handle2faFormSubmit} className="space-y-4">
                {selectedMethod !== 'backup' ? (
                  <div>
                    <label className="block text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      Enter 6-Digit Security PIN
                    </label>
                    <div className="flex justify-center gap-2" onPaste={handlePinPaste}>
                      {pinDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (pinInputRefs.current[idx] = el)}
                          type="text"
                          maxLength={1}
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handlePinChange(idx, e.target.value)}
                          onKeyDown={(e) => handlePinKeyDown(idx, e)}
                          className="w-11 h-12 text-center text-xl font-mono font-bold bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm text-zinc-900 dark:text-zinc-50"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Recovery Code (e.g. 8F2A-9C4B)
                    </label>
                    <input
                      type="text"
                      required
                      value={backupCodeVal}
                      onChange={(e) => setBackupCodeVal(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX"
                      className="w-full text-center font-mono font-bold tracking-widest text-base bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm uppercase"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStage2fa(false);
                      setPendingAuth(null);
                      setPinDigits(['', '', '', '', '', '']);
                      setError('');
                    }}
                    className="w-1/3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-xl py-2.5 text-xs transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <RotateCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                <span>Tip: Test codes </span>
                <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-zinc-600 dark:text-zinc-300">123456</code>
                <span> or </span>
                <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-zinc-600 dark:text-zinc-300">1234</code>
                <span> are accepted for rapid testing.</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

