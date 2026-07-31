'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, UsersRound } from 'lucide-react';
import { useApp } from '@/lib/context';
import { DEMO_LOGIN_USERS, type DemoLoginUser } from '@/lib/demo-auth';

export default function LoginPage() {
  const { login, backendStatus } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  function handleForgotPassword() {
    setError('Password reset is not connected yet. Contact your campus administrator to reset your access.');
  }

  function applyDemoUser(user: DemoLoginUser) {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  }

  return (
    <main className="sc-login">
      <section className="sc-login__visual" aria-label="SuperCampus unified access">
        <div className="sc-login__brand"><span className="sc-login__brand-mark">SC</span> <span className="sc-login__brand-name sc-font-secondary">SuperCampus</span></div>
        <div className="sc-login__visual-copy">
          <span className="sc-login__eyebrow">Unified campus access</span>
          <h1>One login for every campus workflow.</h1>
          <p>Students, admission teams, managers, and admins enter the same secure workspace. Your institution controls what each user can access.</p>
          <div className="sc-login__roles" aria-label="Supported user roles">
            <span><UsersRound size={14} /> Students</span>
            <span>Managers</span>
            <span>Admissions</span>
            <span>Admins</span>
          </div>
          <div className="sc-login__preview" aria-hidden="true">
            <div className="sc-login__preview-top">
              <span>Campus Control</span>
              <strong>Live</strong>
            </div>
            <div className="sc-login__preview-grid">
              <div>
                <small>CRM</small>
                <strong>128</strong>
                <span>Active leads</span>
              </div>
              <div>
                <small>ERP</small>
                <strong>42</strong>
                <span>Today updates</span>
              </div>
              <div>
                <small>Fees</small>
                <strong>91%</strong>
                <span>Collection health</span>
              </div>
            </div>
            <div className="sc-login__preview-bar"><span /></div>
          </div>
        </div>
        <div className="sc-login__metrics">
          <div><strong>One admin</strong><span>All operations</span></div>
          <div><strong>Role based</strong><span>CRM and ERP access</span></div>
          <div><strong>Widget ready</strong><span>Custom dashboards</span></div>
        </div>
      </section>

      <section className="sc-login__form-side">
        <form className="sc-login-card" onSubmit={handleSubmit}>
          <div className="sc-login-card__mobile-brand"><span className="sc-login-card__mobile-mark">SC</span> <span className="sc-font-secondary">SuperCampus</span></div>
          <div className="sc-login-card__heading"><span className={`sc-login-card__status sc-login-card__status--${backendStatus}`} /> Secure access</div>
          <h2>Sign in</h2>
          <p className="sc-login-card__sub">Use the email and password issued by your campus. The same login works for students, staff, managers, and admins.</p>

          <label className="sc-field"><span>Email</span>
            <div className="sc-field__with-icon"><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="name@college.edu.in" required /></div>
          </label>
          <label className="sc-field"><span>Password</span>
            <div className="sc-field__password"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required minLength={8} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </label>
          <div className="sc-login-card__actions">
            <button type="button" className="sc-login-card__forgot" onClick={handleForgotPassword}>Forgot password?</button>
          </div>
          {error && <div className="sc-login-card__error" role="alert">{error}</div>}
          <button className="sc-login-card__submit" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}<ArrowRight size={18} /></button>

          <div className="sc-login-card__credentials">
            <div className="sc-login-card__credentials-head">
              <span><KeyRound size={14} /> Role credentials</span>
              <small>Click to fill</small>
            </div>
            <div className="sc-login-card__credentials-list">
              {DEMO_LOGIN_USERS.map((user) => (
                <button type="button" key={user.id} onClick={() => applyDemoUser(user)}>
                  <span>
                    <strong>{user.role}</strong>
                    <small>{user.name}</small>
                  </span>
                  <code>{user.email}</code>
                  <code>{user.password}</code>
                </button>
              ))}
            </div>
          </div>

          <p className="sc-login-card__help"><ShieldCheck size={14} /> Access is assigned by the admin settings dashboard.</p>
        </form>
      </section>
    </main>
  );
}
