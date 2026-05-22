'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/authApi';
import { useAuthStore } from '@/store/authStore';

type Step = 'credentials' | 'otp' | 'school';

export default function SignupPage() {
  const router = useRouter();
  const { login, updateUser, token: storeToken } = useAuthStore();

  const [step, setStep] = useState<Step>('credentials');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'otp') otpRefs.current[0]?.focus();
  }, [step]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email || !password) return setError('All fields are required');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      await authApi.signup(name, email, password);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) setOtp(pasted.split(''));
    e.preventDefault();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length !== 6) return setError('Enter the 6-digit code');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, code);
      if (res.token && res.user) {
        setTempToken(res.token);
        login(res.user, res.token);
        setStep('school');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!schoolName.trim()) return setError('Please enter your school or college name');
    setLoading(true);
    try {
      const token = tempToken || storeToken || '';
      const res = await authApi.setSchool(schoolName.trim(), token);
      if (res.token && res.user) updateUser(res.user, res.token);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save school name');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Account', 'Verify Email', 'School'];
  const stepIndex = step === 'credentials' ? 0 : step === 'otp' ? 1 : 2;

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 500 }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="sidebar-logo-icon" style={{ width: 36, height: 36 }}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="sidebar-logo-text">VedaAI</span>
        </div>

        {/* Step indicator */}
        <div className="signup-steps">
          {steps.map((s, i) => (
            <div key={s} className="signup-step-item">
              <div className={`signup-step-dot ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}>
                {i < stepIndex
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span>{i + 1}</span>
                }
              </div>
              <span className={`signup-step-label ${i === stepIndex ? 'active' : ''}`}>{s}</span>
              {i < steps.length - 1 && <div className={`signup-step-line ${i < stepIndex ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Credentials ── */}
        {step === 'credentials' && (
          <>
            <h1 className="login-title">Create your account</h1>
            <p className="login-subtitle">Start generating AI-powered question papers</p>
            <form onSubmit={handleSignup} className="login-form">
              <div className="login-field">
                <label className="form-label">Full name</label>
                <input id="signup-name" type="text" className="form-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
              <div className="login-field">
                <label className="form-label">Email address</label>
                <input id="signup-email" type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="login-field">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="signup-password" type={showPass ? 'text' : 'password'} className="form-input" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
              <div className="login-field">
                <label className="form-label">Confirm password</label>
                <input id="signup-confirm" type="password" className="form-input" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              {error && <div className="login-error">{error}</div>}
              <button id="signup-submit" type="submit" className="login-btn" disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} /> : 'Send Verification Code →'}
              </button>
            </form>
            <p className="login-switch">Already have an account? <Link href="/login" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link></p>
          </>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 'otp' && (
          <>
            <h1 className="login-title">Check your email</h1>
            <p className="login-subtitle">We sent a 6-digit code to <strong>{email}</strong></p>
            <form onSubmit={handleVerifyOtp} className="login-form">
              <div className="otp-grid" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-box ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                  />
                ))}
              </div>
              {error && <div className="login-error">{error}</div>}
              <button id="otp-submit" type="submit" className="login-btn" disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} /> : 'Verify Code →'}
              </button>
              <button type="button" className="login-resend" onClick={() => { setOtp(['','','','','','']); handleSignup({ preventDefault: () => {} } as React.FormEvent); }}>
                Didn&apos;t receive it? Resend OTP
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: School ── */}
        {step === 'school' && (
          <>
            <h1 className="login-title">One last step 🎓</h1>
            <p className="login-subtitle">This appears on every question paper you generate</p>
            <form onSubmit={handleSetSchool} className="login-form">
              <div className="login-field">
                <label className="form-label">School / College name</label>
                <input id="school-name-input" type="text" className="form-input" placeholder="e.g. Delhi Public School, Bokaro" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} autoFocus />
              </div>
              {error && <div className="login-error">{error}</div>}
              <button id="school-submit" type="submit" className="login-btn" disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} /> : 'Get Started →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
