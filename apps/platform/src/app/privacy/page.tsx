import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout, TocItem } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import { ExternalLink, Mail, AlertCircle, Info } from 'lucide-react';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'SuperCampus Privacy Policy',
  description:
    'Comprehensive Privacy Policy for SuperCampus: how we collect, use, protect, and process personal, academic, and campus activity data.',
  alternates: {
    canonical: 'https://supercampus.ai/privacy',
  },
};

const TOC: TocItem[] = [
  { id: 'intro', title: '1. Introduction & Scope' },
  { id: 'collection', title: '2. Information We Collect' },
  { id: 'automatic-data', title: '3. Automatically Collected Information' },
  { id: 'usage', title: '4. How We Use Information' },
  { id: 'sharing', title: '5. How We Share Information' },
  { id: 'security', title: '6. Data Security Safeguards' },
  { id: 'retention', title: '7. Data Retention Policies' },
  { id: 'deletion', title: '8. Account Deletion & Rights' },
  { id: 'student-privacy', title: "9. Children's & Students' Privacy" },
  { id: 'third-parties', title: '10. Third-Party Services' },
  { id: 'updates', title: '11. Changes to this Policy' },
  { id: 'contact', title: '12. Contact & Privacy Office' },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lead="This Privacy Policy explains how SuperCampus collects, protects, uses, and discloses information when you access our mobile and web campus management applications, student portals, and administrative services."
      badge="Data Protection & Privacy"
      lastUpdated="September 24, 2026"
      breadcrumbs={[{ label: 'Privacy Policy', href: '/privacy' }]}
      tocItems={TOC}
    >
      {/* 1. Introduction */}
      <LegalSection id="intro" number="1" title="Introduction & Scope">
        <p>
          Welcome to <strong>SuperCampus</strong> (accessible at{' '}
          <code className={styles.refBadge} style={{ padding: '2px 8px', fontSize: '13px' }}>
            supercampus.ai
          </code>{' '}
          and through associated mobile and web applications). SuperCampus is a modern, unified
          campus management platform (combining CRM and ERP systems) built specifically for colleges,
          universities, and higher-education institutions.
        </p>
        <p>
          Our platform powers vital campus operations, including student profiles, admissions,
          attendance tracking, academics, weekly timetables, fee records, digital gatepasses, hostel
          allotments, canteen wallets, library operations, and institutional notifications.
        </p>
        <p>
          This Privacy Policy sets out the basis on which any personal data we collect from you, or
          that your educational institution provides to us, will be processed. By using SuperCampus,
          you acknowledge the data handling practices described in this document.
        </p>
        <div className={`${styles.callout} ${styles.calloutInfo}`}>
          <Info size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>Institutional Partnership Model</strong>
            SuperCampus serves primarily as a digital processor on behalf of partner educational
            institutions. Your college or university controls the academic policies and institutional
            records stored within the system.
          </div>
        </div>
      </LegalSection>

      {/* 2. Information We Collect */}
      <LegalSection id="collection" number="2" title="Information We Collect">
        <p>
          To deliver a comprehensive campus ERP experience, SuperCampus processes several categories
          of information provided directly by users or synchronized by institutional administrators:
        </p>

        <h3 className={styles.subSectionTitle}>A. Personal Identity Information</h3>
        <ul className={styles.bulletList}>
          <li><strong>Full Name & Contact Details:</strong> Name, institutional email address, personal email, and mobile phone number.</li>
          <li><strong>Institutional Identifiers:</strong> Student roll number, registration number, employee/staff code, and department.</li>
          <li><strong>Academic Standing:</strong> Current program, degree, branch/specialization, semester, year of study, and section.</li>
          <li><strong>Profile Media:</strong> Profile photos or ID avatars uploaded for digital identity verification.</li>
          <li><strong>Emergency & Guardian Contacts:</strong> Parent/guardian contact details provided for communication and hostel safety.</li>
        </ul>

        <h3 className={styles.subSectionTitle}>B. Academic Information</h3>
        <ul className={styles.bulletList}>
          <li><strong>Attendance Records:</strong> Classroom attendance, lecture sessions, laboratory logins, on-duty approvals, and medical leave logs.</li>
          <li><strong>Timetable & Courses:</strong> Enrolled courses, elective selections, weekly schedule slots, and faculty assignments.</li>
          <li><strong>Academic Performance:</strong> Internal assessment scores, semester grades, GPA/CGPA calculations, and arrear/backlog trackers.</li>
        </ul>

        <h3 className={styles.subSectionTitle}>C. Campus Activity & Operational Information</h3>
        <ul className={styles.bulletList}>
          <li><strong>Gatepass & Campus Access:</strong> Out-pass requests, security approvals, entry/exit timestamp scans, and visitor QR logs.</li>
          <li><strong>Hostel & Mess Management:</strong> Hostel block, room number, bed allotment, dining mess attendance, and room maintenance complaints.</li>
          <li><strong>Library Management:</strong> Borrowed books, due dates, renewal requests, and digital catalog reservations.</li>
          <li><strong>Canteen & Campus Store:</strong> Digital token balances, meal orders, pre-orders, and canteen purchase histories.</li>
          <li><strong>Institutional Communications:</strong> Campus notices, circulars, announcements, and grievance/feedback submissions.</li>
        </ul>

        <h3 className={styles.subSectionTitle}>D. Payment Information</h3>
        <p>
          SuperCampus enables students and parents to view fee structures, balances, and initiate
          dues clearance (e.g. tuition, examination, hostel, transport, or library fees).
        </p>
        <ul className={styles.bulletList}>
          <li><strong>Recorded Payment Data:</strong> Transaction reference IDs, invoice numbers, timestamps, amount paid, and fee clearance status.</li>
        </ul>

        <div className={`${styles.callout} ${styles.calloutWarning}`}>
          <AlertCircle size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>Zero Storage of Sensitive Payment Credentials</strong>
            SuperCampus does NOT store debit or credit card numbers, CVV codes, UPI PINs, net banking
            passwords, or sensitive payment credentials. All payments are processed directly through
            licensed, PCI-DSS-compliant third-party payment gateways.
          </div>
        </div>
      </LegalSection>

      {/* 3. Automatically Collected Information */}
      <LegalSection id="automatic-data" number="3" title="Automatically Collected Information">
        <p>
          When you access SuperCampus via our mobile applications (Android/iOS) or web portal, our
          systems automatically record diagnostic and session information reasonably required to
          maintain service integrity:
        </p>
        <ul className={styles.bulletList}>
          <li><strong>Device & Environment Details:</strong> Device manufacturer, hardware model, operating system version, browser type, and app build version.</li>
          <li><strong>Network Identifiers:</strong> Internet Protocol (IP) address, approximate geographic area inferred from IP, and connection type.</li>
          <li><strong>Session & Security Logs:</strong> Authentication timestamps, failed login attempts, password update logs, and session durations.</li>
          <li><strong>Performance & Crash Analytics:</strong> Error stack traces, unhandled exceptions, and component rendering times used to resolve software bugs.</li>
        </ul>
      </LegalSection>

      {/* 4. How We Use Information */}
      <LegalSection id="usage" number="4" title="How We Use Information">
        <p>We process collected data exclusively for legitimate operational, educational, and platform purposes:</p>
        <ul className={styles.bulletList}>
          <li><strong>Delivering Campus Services:</strong> Providing real-time timetable updates, attendance self-check, digital ID card rendering, and gatepass issuance.</li>
          <li><strong>Authentication & Security:</strong> Verifying user identity, protecting student records against unauthorized access, and validating multi-role permissions (e.g., student vs. class advisor vs. accountant).</li>
          <li><strong>Academic Workflow Management:</strong> Calculating semester attendance condonation thresholds, publishing internal marks, and tracking graduation eligibility.</li>
          <li><strong>Payment Recording:</strong> Reconciling fee dues with college bank accounts and generating tamper-proof digital receipts.</li>
          <li><strong>Campus Safety & Operations:</strong> Assisting wardens with night hostel headcounts and campus security with verified QR gatepass validation.</li>
          <li><strong>Administrative Communication:</strong> Sending critical institutional circulars, exam schedule notifications, and emergency alerts.</li>
          <li><strong>Platform Maintenance & Enhancement:</strong> Diagnosing performance bottlenecks, squashing software defects, and optimizing portal responsiveness.</li>
          <li><strong>Legal & Regulatory Compliance:</strong> Fulfilling mandatory university audits, government reporting requirements, and lawful requests.</li>
        </ul>
      </LegalSection>

      {/* 5. How We Share Information */}
      <LegalSection id="sharing" number="5" title="How We Share Information">
        <p>
          We respect student privacy. <strong>SuperCampus does not sell, rent, or trade your personal information to advertisers or data brokers.</strong>
        </p>
        <p>Information is shared only under strict operational boundaries:</p>
        <ul className={styles.bulletList}>
          <li>
            <strong>With Your Educational Institution:</strong> Authorized university administrators,
            principals, department heads, faculty advisors, and hostel wardens have access to student
            data strictly relevant to their administrative role.
          </li>
          <li>
            <strong>With Certified Infrastructure Providers:</strong> Trusted cloud hosting, database,
            and transactional email/SMS service providers operating under strict confidentiality and
            data processing agreements.
          </li>
          <li>
            <strong>With Regulated Payment Processors:</strong> Necessary transaction metadata (student ID,
            fee category, bill amount) is transmitted to authorized payment gateways to complete fee transactions.
          </li>
          <li>
            <strong>For Legal & Regulatory Protections:</strong> When required by court order, law
            enforcement directive, or applicable statutory regulation, or to protect the vital physical
            safety of students and campus staff.
          </li>
        </ul>
      </LegalSection>

      {/* 6. Data Security */}
      <LegalSection id="security" number="6" title="Data Security Safeguards">
        <p>
          We employ robust, industry-standard administrative, physical, and technical safeguards to
          protect student and institutional data against accidental loss, unauthorized access,
          alteration, or disclosure:
        </p>
        <ul className={styles.bulletList}>
          <li><strong>Encryption in Transit:</strong> All HTTP traffic is strictly encrypted using Transport Layer Security (TLS 1.2+ and TLS 1.3).</li>
          <li><strong>Encryption at Rest:</strong> Database volumes, file attachments, and backups are encrypted using AES-256 standard encryption.</li>
          <li><strong>Role-Based Access Controls (RBAC):</strong> Strict principle-of-least-privilege boundaries prevent unauthorized cross-tenant or cross-department access.</li>
          <li><strong>Immutable Audit Logging:</strong> Sensitive actions (such as attendance edits, grade overrides, and gatepass approvals) maintain verifiable digital audit trails.</li>
        </ul>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          <em>
            Please note: While we implement rigorous safeguards, no electronic transmission over the
            internet or cloud storage architecture can be guaranteed as 100% impenetrable. We encourage
            users to maintain strong, unique passwords and never share their institutional login credentials.
          </em>
        </p>
      </LegalSection>

      {/* 7. Data Retention */}
      <LegalSection id="retention" number="7" title="Data Retention Policies">
        <p>
          Information is retained only for as long as necessary to fulfill the academic, administrative,
          and contractual purposes for which it was collected.
        </p>
        <ul className={styles.bulletList}>
          <li>
            <strong>Active Enrollment Period:</strong> Profile, attendance, timetable, and campus
            service records remain active throughout a student&apos;s educational program.
          </li>
          <li>
            <strong>Statutory Academic Transcripts:</strong> Official semester grade transcripts, degree
            awards, and enrollment registers are permanently maintained by the partner college in
            accordance with university accreditation and statutory education regulations.
          </li>
          <li>
            <strong>Financial & Fee Records:</strong> Tuition payment ledgers and invoice audit logs are
            retained for statutory periods required by commercial tax and audit laws (typically 7 years).
          </li>
          <li>
            <strong>Session & Security Logs:</strong> Transient app diagnostic logs, authentication logs,
            and error traces are automatically purged on a rolling cycle (typically 30 to 90 days).
          </li>
        </ul>
      </LegalSection>

      {/* 8. Account Deletion */}
      <LegalSection id="deletion" number="8" title="Account Deletion & Rights">
        <p>
          You have the right to request deletion of your SuperCampus account and associated personal data.
          We provide a dedicated self-service deletion request portal:
        </p>
        <div style={{ margin: '18px 0' }}>
          <Link href="/delete-account" className={styles.actionButton}>
            <span>Go to Account Deletion Request Page</span>
            <ExternalLink size={14} />
          </Link>
        </div>
        <p>
          When an account deletion request is processed:
        </p>
        <ul className={styles.bulletList}>
          <li>Your login credentials, push notification tokens, and personal device sessions are permanently invalidated.</li>
          <li>Personal preferences, non-statutory activity logs, and personal profile metadata are removed or irreversibly anonymized.</li>
          <li>
            <strong>Institutional Record Caveat:</strong> Official academic transcripts, historical
            exam marks, graduation records, and government-mandated attendance registers cannot be deleted
            by SuperCampus unilaterally because they are official property of your educational institution.
          </li>
        </ul>
        <p>
          For complete instructions and service implications, review our{' '}
          <Link href="/delete-account" style={{ color: '#0f766e', fontWeight: 700 }}>
            Account Deletion Guide
          </Link>.
        </p>
      </LegalSection>

      {/* 9. Children's & Students' Privacy */}
      <LegalSection id="student-privacy" number="9" title="Children's & Students' Privacy">
        <p>
          SuperCampus is designed for college, university, and vocational campus environments. Our primary
          users are young adults, faculty, and administrative staff. Where the platform is deployed in
          junior colleges or secondary educational programs involving minors, access is provided under
          the direct auspices and consent of the educational institution and parent/guardian authorizations.
        </p>
        <p>
          We do not knowingly collect personal information directly from children under 13 without
          institutional verification. If you believe student data was provided inappropriately, contact{' '}
          <a href="mailto:privacy@supercampus.ai" style={{ color: '#0f766e', fontWeight: 700 }}>
            privacy@supercampus.ai
          </a>{' '}
          for immediate review and remediation.
        </p>
      </LegalSection>

      {/* 10. Third-Party Services */}
      <LegalSection id="third-parties" number="10" title="Third-Party Services">
        <p>
          To maintain high availability and seamless campus functionality, SuperCampus integrates with
          vetted third-party cloud infrastructure and technical service providers:
        </p>
        <ul className={styles.bulletList}>
          <li><strong>Cloud Hosting & Compute:</strong> Scalable enterprise data center providers adhering to ISO 27001 and SOC 2 Type II security standards.</li>
          <li><strong>Payment Gateways:</strong> Regulated payment processors holding Level 1 PCI-DSS compliance certification.</li>
          <li><strong>Transactional Notifications:</strong> SMS gateways and push notification services (e.g. Firebase Cloud Messaging) for delivery of gatepass approvals and time-critical announcements.</li>
          <li><strong>Application Performance Monitoring:</strong> Error logging and crash reporting frameworks that assist our engineering teams in resolving software issues.</li>
        </ul>
        <p>
          Third-party integrations operate under confidentiality agreements that prohibit the use of your
          personal information for any reason other than providing the contracted service.
        </p>
      </LegalSection>

      {/* 11. Changes to this Policy */}
      <LegalSection id="updates" number="11" title="Changes to this Policy">
        <p>
          We may update this Privacy Policy periodically to reflect enhancements to our platform, changes
          in statutory legal frameworks, or adjustments in our operational practices. When material updates
          occur, we will update the &quot;Effective Date&quot; at the top of this document and notify users
          via an in-app notice, banner, or direct email communication.
        </p>
        <p>
          We encourage you to review this Privacy Policy regularly to stay informed about how we safeguard
          your campus information.
        </p>
      </LegalSection>

      {/* 12. Contact */}
      <LegalSection id="contact" number="12" title="Contact & Privacy Office">
        <p>
          If you have questions, feedback, or requests regarding this Privacy Policy or wish to exercise
          your privacy rights under applicable data protection laws, please contact our Privacy Team:
        </p>
        <div className={styles.callout} style={{ background: '#f8fafc' }}>
          <Mail size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>SuperCampus Privacy Office</strong>
            <span>Official Email: </span>
            <a href="mailto:privacy@supercampus.ai" style={{ color: '#0f766e', fontWeight: 700 }}>
              privacy@supercampus.ai
            </a>
            <br />
            <span>Platform Domain: </span>
            <strong>supercampus.ai</strong>
            <br />
            <span>General Inquiries: </span>
            <Link href="/contact" style={{ color: '#0f766e', fontWeight: 700 }}>
              Visit Contact & Support Page
            </Link>
          </div>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
