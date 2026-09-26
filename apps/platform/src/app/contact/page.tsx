import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { ContactForm } from '@/components/legal/ContactForm';
import { HelpCircle, Mail, Shield, Trash2, Building, Clock } from 'lucide-react';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'SuperCampus Contact & Support',
  description:
    'Get support for SuperCampus, report application issues, reach data protection officers, or find institutional administrative guidance.',
  alternates: {
    canonical: 'https://supercampus.ai/contact',
  },
};

export default function ContactPage() {
  return (
    <LegalPageLayout
      title="Contact & Support"
      lead="Need help with your SuperCampus account, have data privacy inquiries, or looking for institutional administration guidance? Reach our dedicated support team."
      badge="Help & Contact Center"
      lastUpdated="September 2026"
      breadcrumbs={[{ label: 'Contact & Support', href: '/contact' }]}
    >
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 850, color: '#0f172a', margin: '0 0 10px' }}>
          How Can We Help You Today?
        </h2>
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
          SuperCampus provides multiple support avenues depending on the nature of your inquiry.
          Select the relevant channel below or submit a direct message to our support desk.
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
              <strong>Attendance Disputes & Condonation:</strong> Only your course faculty, department
              head, or dean of academics has authorization to rectify classroom attendance logs or approve
              medical/on-duty condonation.
            </li>
            <li>
              <strong>Fee Payments & Scholarship Adjustments:</strong> Fee balances, challans, refunds,
              and concession waivers are governed by your college bursar or accounts office.
            </li>
            <li>
              <strong>Hostel Allotment & Mess Preferences:</strong> Room allocations, hostel mess shifts,
              and room key deposits are managed by your campus warden.
            </li>
            <li>
              <strong>Examination Hall Tickets & Revaluation:</strong> Examination dates, arrear payments,
              and grade recalculations are administered by the Controller of Examinations (CoE).
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
