'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { resetPassword } from '@/lib/api';

const MINIMUM_PASSWORD_LENGTH = 12;

function ResetPasswordCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Both passwords must match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to reset the password');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="sc-login-card">
        <div className="sc-login-card__heading">Account recovery</div>
        <h2>Link incomplete</h2>
        <p className="sc-login-card__sub">This address has no reset token. Open the link exactly as it appears in your email, or request a new one.</p>
        <Link className="sc-login-card__submit" href="/">Back to sign in<ArrowRight size={18} /></Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="sc-login-card">
        <div className="sc-login-card__heading">Account recovery</div>
        <h2>Password updated</h2>
        <p className="sc-login-card__sub">Your password has been changed and every existing session was signed out. Sign in with your new password.</p>
        <div className="sc-login-card__notice" role="status"><CheckCircle2 size={15} /> <span>You can close this tab once you have signed in.</span></div>
        <Link className="sc-login-card__submit" href="/">Go to sign in<ArrowRight size={18} /></Link>
      </div>
    );
  }

  return (
    <form className="sc-login-card" onSubmit={handleSubmit}>
      <div className="sc-login-card__heading">Account recovery</div>
      <h2>Choose a new password</h2>
      <p className="sc-login-card__sub">Use at least {MINIMUM_PASSWORD_LENGTH} characters. Setting a new password signs out all of your other devices.</p>

      <label className="sc-field"><span>New password</span>
        <div className="sc-field__password"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={MINIMUM_PASSWORD_LENGTH} />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
      </label>
      <label className="sc-field"><span>Confirm new password</span>
        <div className="sc-field__password"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={MINIMUM_PASSWORD_LENGTH} /></div>
      </label>

      {error && <div className="sc-login-card__error" role="alert">{error}</div>}
      <button className="sc-login-card__submit" type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Update password'}<ArrowRight size={18} /></button>
      <p className="sc-login-card__help"><ShieldCheck size={14} /> Reset links expire in 60 minutes and can be used once.</p>
    </form>
  );
}

// useSearchParams must sit inside a Suspense boundary or the production build fails.
export default function ResetPasswordPage() {
  return (
    <main className="sc-login sc-login--single">
      <section className="sc-login__form-side">
        <Suspense fallback={<div className="sc-auth-loading"><div className="sc-auth-loading__mark">SC</div><span>Opening the reset form...</span></div>}>
          <ResetPasswordCard />
        </Suspense>
      </section>
    </main>
  );
}
