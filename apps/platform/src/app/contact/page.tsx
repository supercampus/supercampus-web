import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { ContactForm } from '@/components/legal/ContactForm';
import { HelpCircle, Mail, Shield, Trash2, Building, Clock } from 'lucide-react';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'SuperCampus Contact & Support',
  description:
    'Contact SuperCampus for app support, privacy questions, grievances and account deletion, and see which matters your college handles.',
  alternates: {
    canonical: 'https://supercampus.ai/contact',
  },
};

export default function ContactPage() {
  return (
    <LegalPageLayout
      title="Contact & Support"
      lead="Need help with your SuperCampus account, or have a question about your personal data? Here is how to reach us."
      badge="Help & Contact Center"
      lastUpdated="September 28, 2026"
      breadcrumbs={[{ label: 'Contact & Support', href: '/contact' }]}
    >
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 850, color: '#0f172a', margin: '0 0 10px' }}>
          How Can We Help You Today?
        </h2>
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
          Pick the topic below, or send us a message. Signed-in users can also use Settings → Help
          &amp; support in the app, which routes a request to the right office at your college.
        </p>
      </div>

      {/* Interactive Contact Form & Channel Grid */}
      <ContactForm />

      {/* Institutional Support Clarification */}
      <div className={styles.contentCard} style={{ marginTop: '36px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
          Notice for College Students & Faculty Members
        </h3>

        <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.7 }}>
          <p>
            Please note that while SuperCampus develops and operates the mobile and web software, official
            academic data and policies are owned and administered directly by your educational institution:
          </p>

          <ul className={styles.bulletList} style={{ margin: '14px 0' }}>
            <li>
              <strong>Attendance:</strong> only your faculty or department can correct attendance or
              approve on-duty and medical leave.
            </li>
            <li>
              <strong>Fees:</strong> fee amounts, refunds and concessions are handled by your college
              accounts office.
            </li>
            <li>
              <strong>Hostel & Mess:</strong> room allocation, mess and hostel rules are managed by your
              hostel warden.
            </li>
            <li>
              <strong>Gatepass Approvals:</strong> leave-pass and outpass approvals are decided by your
              college&apos;s approvers, such as your class advisor or warden.
            </li>
            <li>
              <strong>Marks & Examinations:</strong> marks, results and examination matters are handled
              by your faculty and your college&apos;s examination office.
            </li>
          </ul>

          <div className={`${styles.callout} ${styles.calloutInfo}`} style={{ margin: '18px 0 0' }}>
            <Building size={18} className={styles.calloutIcon} />
            <div className={styles.calloutText}>
              <strong>Direct Campus Administration Contact</strong>
              For any of the official academic matters listed above, please contact your college&apos;s
              administrative office, Head of Department (HOD), or registrar directly.
            </div>
          </div>
        </div>
      </div>
    </LegalPageLayout>
  );
}
