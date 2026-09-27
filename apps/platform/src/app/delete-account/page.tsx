import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { DeleteAccountForm } from '@/components/legal/DeleteAccountForm';
import { ShieldCheck, AlertTriangle, HelpCircle, Lock } from 'lucide-react';
import { CONTACT_EMAIL } from '@/lib/legal-api';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'Delete Your SuperCampus Account',
  description:
    'Request deletion of your SuperCampus account and personal data, and see what is deleted and what your college must keep.',
  alternates: {
    canonical: 'https://supercampus.ai/delete-account',
  },
};

export default function DeleteAccountPage() {
  return (
    <LegalPageLayout
      title="Delete Your SuperCampus Account"
      lead="Ask us to delete your SuperCampus account and personal data, and see what happens to your campus services and records."
      badge="Account Management & Data Rights"
      badgeType="warning"
      lastUpdated="September 28, 2026"
      breadcrumbs={[{ label: 'Delete Account', href: '/delete-account' }]}
    >
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 850, color: '#0f172a', margin: '0 0 10px' }}>
          Account Deletion & Data Privacy
        </h2>
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
          You can ask us to delete your SuperCampus account and personal data at any time, as provided
          under India&apos;s Digital Personal Data Protection Act, 2023. Use the form below, or email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#0f766e', fontWeight: 700 }}>
            {CONTACT_EMAIL}
          </a>{' '}
          from your registered email address.
        </p>
      </div>

      {/* Production Delete Account Form */}
      <DeleteAccountForm />

      {/* Additional Regulatory & Institutional Information */}
      <div className={styles.contentCard} style={{ marginTop: '36px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
          Understanding the Account Deletion Workflow
        </h3>

        <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.7 }}>
          <p>
            Your account is issued by your college, so a deletion request goes through these steps:
          </p>

          <ol style={{ paddingLeft: '20px', margin: '14px 0' }}>
            <li style={{ marginBottom: '10px' }}>
              <strong>We confirm it is you:</strong> we reply to your email to make sure the request
              comes from the account holder before anything is deleted.
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Your college is informed:</strong> so that pending items such as library books or
              unpaid fees can be settled.
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Your account is deleted:</strong> you are signed out everywhere, your account and
              notification tokens are disabled, and personal data we are not required to keep is deleted
              or anonymised.
            </li>
          </ol>

          <div className={`${styles.callout} ${styles.calloutInfo}`} style={{ margin: '18px 0 0' }}>
            <HelpCircle size={18} className={styles.calloutIcon} />
            <div className={styles.calloutText}>
              <strong>Have Questions or Need Help?</strong>
              If you have graduated or transferred and need assistance with official transcripts, contact
              your college administrative office. For help with a deletion request, email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#0f766e', fontWeight: 700 }}>
                {CONTACT_EMAIL}
              </a>{' '}
              or reach our{' '}
              <Link href="/contact" style={{ color: '#0f766e', fontWeight: 700 }}>
                Support Center
              </Link>.
            </div>
          </div>
        </div>
      </div>
    </LegalPageLayout>
  );
}
