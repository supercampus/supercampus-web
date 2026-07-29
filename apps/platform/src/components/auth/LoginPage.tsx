'use client';

import { FormEvent, useState } from 'react';
import { useApp } from '@/lib/context';

export default function LoginPage() {
  const { login, backendStatus } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('');
    try { await login({ email, password }); }
    catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'Unable to sign in'); }
    finally { setSubmitting(false); }
  }

  return (
    <main className="sc-login">
      <section className="sc-login__visual" aria-label="Super Campus introduction">
        <div className="sc-login__brand"><span className="sc-login__brand-mark">✦</span> Super Campus</div>
        <div className="sc-login__visual-copy">
          <span className="sc-login__eyebrow">One campus. One secure workspace.</span>
          <h1>Everything you need for campus life, beautifully connected.</h1>
          <p>Access academics, attendance, fees, campus services and your student identity through your college workspace.</p>
          <div className="sc-login__metrics">
            <div><strong>14</strong><span>Campus modules</span></div>
            <div><strong>24/7</strong><span>Student access</span></div>
            <div><strong>Secure</strong><span>Tenant sessions</span></div>
          </div>
        </div>
        <div className="sc-login__orb sc-login__orb--one" /><div className="sc-login__orb sc-login__orb--two" />
      </section>

      <section className="sc-login__form-side">
        <form className="sc-login-card" onSubmit={handleSubmit}>
          <div className="sc-login-card__mobile-brand"><span>✦</span> Super Campus</div>
          <div className="sc-login-card__heading"><span className={`sc-login-card__status sc-login-card__status--${backendStatus}`} /> Student portal</div>
          <h2>Welcome back</h2>
          <p className="sc-login-card__sub">Sign in with your college email. We’ll securely connect you to the correct campus workspace.</p>

          <label className="sc-field"><span>College email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="student@college.edu.in" required />
          </label>
          <label className="sc-field"><span>Password</span>
            <div className="sc-field__password"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required minLength={8} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          {error && <div className="sc-login-card__error" role="alert">{error}</div>}
          <button className="sc-login-card__submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in to dashboard'}<span>→</span></button>


          <p className="sc-login-card__help">Need help? Contact your college administrator.</p>
        </form>
      </section>
    </main>
  );
}