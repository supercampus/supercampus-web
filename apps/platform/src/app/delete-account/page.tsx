import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { DeleteAccountForm } from '@/components/legal/DeleteAccountForm';
import { ShieldCheck, AlertTriangle, HelpCircle, Lock } from 'lucide-react';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'Delete Your SuperCampus Account',
  description:
    'Submit an account deletion request for your SuperCampus account and review service impacts, institutional record retention, and data purging workflows.',
  alternates: {
    canonical: 'https://supercampus.ai/delete-account',
  },
};

export default function DeleteAccountPage() {
  return (
    <LegalPageLayout
      title="Delete Your SuperCampus Account"
      lead="Request account deletion and review the impact on campus services, attendance records, academic transcripts, and institutional data retention requirements."
      badge="Account Management & Data Rights"
      badgeType="warning"
      lastUpdated="September 24, 2026"
      breadcrumbs={[{ label: 'Delete Account', href: '/delete-account' }]}
    >
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 850, color: '#0f172a', margin: '0 0 10px' }}>
          Account Deletion & Data Privacy
        </h2>
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
          In accordance with Google Play Store policies and international data protection standards
          (including GDPR and digital personal data protection frameworks), SuperCampus provides this
          dedicated self-service portal allowing users to request the permanent deletion of their account
          and personal credentials.
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
            Because SuperCampus operates as an authorized Educational Enterprise Resource Planning (ERP)
            system in partnership with colleges and universities, processing an account deletion request
            involves a structured 3-tier lifecycle:
          </p>

          <ol style={{ paddingLeft: '20px', margin: '14px 0' }}>
            <li style={{ marginBottom: '10px' }}>
              <strong>Identity Verification:</strong> To protect student safety and prevent malicious or
              accidental account destruction, we reply to your request to confirm the account belongs
              to you before anything is deleted.
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Institutional Clearance Audit:</strong> Your partner institution&apos;s registrar
              or administrative office reviews pending clearances (e.g. library book dues, semester exam
              hall-ticket archives, or unpaid fee dues).
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Data Deletion & Credential Revocation:</strong> Your login authentication records,
              device sessions, push tokens, and non-statutory personal data are permanently purged from
              active production databases.
            </li>
          </ol>

          <div className={`${styles.callout} ${styles.calloutInfo}`} style={{ margin: '18px 0 0' }}>
            <HelpCircle size={18} className={styles.calloutIcon} />
            <div className={styles.calloutText}>
              <strong>Have Questions or Need Help?</strong>
              If you have graduated or transferred and need assistance with official transcripts, contact
              your college administrative office. For technical assistance with this portal, email{' '}
              <a href="mailto:privacy@supercampus.ai" style={{ color: '#0f766e', fontWeight: 700 }}>
                privacy@supercampus.ai
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
