'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, LoaderCircle, LockKeyhole } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import PublishedApplicationForm from '@/components/forms/PublishedApplicationForm';
import { uploadPublicApplicationMedia } from '@/lib/api';
import { getPublicApplicationInvitation, submitPublicApplication, verifyPublicApplicationOtp, type PublicApplicationInvitation } from '@/lib/crm-api';

function resolveTenant(queryTenant: string | null) {
  if (queryTenant) return queryTenant;
  if (typeof window === 'undefined') return '';
  const match = window.location.hostname.match(/^application\.([^.]+)\.supercampus\.ai$/i);
  return match?.[1] ?? '';
}

export default function PublicApplicationPage() {
  const params = useParams<{ token: string }>();
  const search = useSearchParams();
  const token = params.token;
  const tenant = useMemo(() => resolveTenant(search.get('tenant')), [search]);
  const [invitation, setInvitation] = useState<PublicApplicationInvitation | null>(null);
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tenant || !token) { setError('This application link is missing its institution domain.'); setLoading(false); return; }
    getPublicApplicationInvitation(tenant, token)
      .then((response) => setInvitation(response.data))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'This application link is unavailable.'))
      .finally(() => setLoading(false));
  }, [tenant, token]);

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit code sent to you.'); return; }
    setVerifying(true); setError('');
    try { setVerificationToken((await verifyPublicApplicationOtp(tenant, token, otp)).data.verificationToken); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The code could not be verified.'); }
    finally { setVerifying(false); }
  };

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 text-black sm:py-12">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <header className="border-b border-neutral-200 px-6 py-5"><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{invitation?.tenantName ?? 'Institution application'}</p><h1 className="mt-1 text-2xl font-bold">{invitation?.form.name ?? 'Application'}</h1>{invitation && <p className="mt-1 text-sm text-neutral-600">Applicant: {invitation.applicantName}</p>}</header>
        <div className="p-6 sm:p-8">
          {loading ? <div className="flex min-h-48 items-center justify-center"><LoaderCircle className="animate-spin" /></div>
            : error && !invitation ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
              : submitted ? <div className="py-16 text-center"><CheckCircle2 size={42} className="mx-auto text-emerald-600" /><h2 className="mt-4 text-xl font-bold">Application submitted</h2><p className="mt-2 text-sm text-neutral-600">The admissions team can now review your application.</p></div>
                : !verificationToken ? <section className="mx-auto max-w-sm py-8 text-center"><LockKeyhole size={34} className="mx-auto" /><h2 className="mt-4 text-lg font-bold">Verify your identity</h2><p className="mt-2 text-sm text-neutral-600">Enter the code sent to {invitation?.maskedContact}.</p><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className="mt-6 w-full rounded-lg border border-neutral-300 px-4 py-3 text-center text-xl font-bold tracking-[0.35em] outline-none focus:border-black" aria-label="One-time code" />{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<button type="button" disabled={verifying} onClick={() => void verify()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{verifying && <LoaderCircle size={16} className="animate-spin" />}Continue</button></section>
                  : invitation && <PublishedApplicationForm schema={invitation.form.schema} onUpload={async (file) => { const uploaded = (await uploadPublicApplicationMedia(tenant, token, verificationToken, file)).data; return { storage: 'cloudinary', fileName: file.name, secureUrl: uploaded.secureUrl, publicId: uploaded.publicId, resourceType: uploaded.resourceType, bytes: uploaded.bytes }; }} onSubmit={async (values) => { await submitPublicApplication(tenant, token, verificationToken, { values }); setSubmitted(true); }} />}
        </div>
      </div>
    </main>
  );
}
