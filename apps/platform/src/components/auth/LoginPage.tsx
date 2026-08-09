'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, MailCheck, ShieldCheck, UsersRound } from 'lucide-react';
import { useApp } from '@/lib/context';
import { forgotPassword } from '@/lib/api';

type Mode = 'signin' | 'forgot';

export default function LoginPage() {
  const { login, backendStatus } = useApp();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setNotice('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login({ email, password });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const { data } = await forgotPassword(email);
      // Deliberately the same message for known and unknown addresses.
      setNotice(data.message);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to send the reset link');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="sc-login">
      <section className="sc-login__visual" aria-label="SuperCampus unified access">
        <div className="sc-login__brand"><span className="sc-login__brand-mark">SC</span> <span className="sc-login__brand-name sc-font-secondary">SuperCampus</span></div>
        <div className="sc-login__visual-copy">
          <span className="sc-login__eyebrow">Unified campus access</span>
          <h1>One login for every campus workflow.</h1>
          <p>Students, admission teams, managers, and administrators use the same secure workspace. Your institution controls the modules and actions available after sign-in.</p>
          <div className="sc-login__roles" aria-label="Supported user roles">
            <span><UsersRound size={14} /> Students</span><span>Managers</span><span>Admissions</span><span>Admins</span>
          </div>
          <div className="sc-login__preview" aria-hidden="true">
            <div className="sc-login__preview-top"><span>Campus Control</span><strong>API connected</strong></div>
            <div className="sc-login__preview-grid">
              <div><small>Identity</small><strong>JWT</strong><span>Secure sessions</span></div>
              <div><small>Tenancy</small><strong>Scoped</strong><span>Isolated records</span></div>
              <div><small>Access</small><strong>RBAC</strong><span>Role permissions</span></div>
            </div>
            <div className="sc-login__preview-bar"><span /></div>
          </div>
        </div>
        <div className="sc-login__metrics">
          <div><strong>One identity</strong><span>Campus membership</span></div>
          <div><strong>Role based</strong><span>Server enforced</span></div>
          <div><strong>Database backed</strong><span>No demo login</span></div>
        </div>
      </section>

      <section className="sc-login__form-side">
        {mode === 'signin' ? (
          <form className="sc-login-card" onSubmit={handleSubmit}>
            <div className="sc-login-card__mobile-brand"><span className="sc-login-card__mobile-mark">SC</span> <span className="sc-font-secondary">SuperCampus</span></div>
            <div className="sc-login-card__heading"><span className={`sc-login-card__status sc-login-card__status--${backendStatus}`} /> Secure access</div>
            <h2>Sign in</h2>
            <p className="sc-login-card__sub">Use the email and password issued by your institution administrator.</p>

            <label className="sc-field"><span>Email</span>
              <div className="sc-field__with-icon"><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="name@college.edu.in" required /></div>
            </label>
            <label className="sc-field"><span>Password</span>
              <div className="sc-field__password"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required minLength={12} />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </label>
            <div className="sc-login-card__actions">
              <button type="button" className="sc-login-card__forgot" onClick={() => switchMode('forgot')}>Forgot password?</button>
            </div>
            {error && <div className="sc-login-card__error" role="alert">{error}</div>}
            <button className="sc-login-card__submit" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}<ArrowRight size={18} /></button>
            <p className="sc-login-card__help"><ShieldCheck size={14} /> Credentials and access are validated by the Rust API.</p>
          </form>
        ) : (
          <form className="sc-login-card" onSubmit={handleForgotSubmit}>
            <div className="sc-login-card__mobile-brand"><span className="sc-login-card__mobile-mark">SC</span> <span className="sc-font-secondary">SuperCampus</span></div>
            <div className="sc-login-card__heading"><span className={`sc-login-card__status sc-login-card__status--${backendStatus}`} /> Account recovery</div>
            <h2>Reset password</h2>
            <p className="sc-login-card__sub">Enter your institution email. If it has an account, we will send a link to choose a new password.</p>

            {notice ? (
              <div className="sc-login-card__notice" role="status"><MailCheck size={15} /> <span>{notice}</span></div>
            ) : (
              <label className="sc-field"><span>Email</span>
                <div className="sc-field__with-icon"><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="name@college.edu.in" required /></div>
              </label>
            )}
            {error && <div className="sc-login-card__error" role="alert">{error}</div>}
            {!notice && (
              <button className="sc-login-card__submit" type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send reset link'}<ArrowRight size={18} /></button>
            )}
            <div className="sc-login-card__actions sc-login-card__actions--center">
              <button type="button" className="sc-login-card__forgot" onClick={() => switchMode('signin')}><ArrowLeft size={13} /> Back to sign in</button>
            </div>
            <p className="sc-login-card__help"><ShieldCheck size={14} /> Reset links expire in 60 minutes and can be used once.</p>
          </form>
        )}
      </section>
    </main>
  );
}
