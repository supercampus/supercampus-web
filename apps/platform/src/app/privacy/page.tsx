import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout, TocItem } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import { ExternalLink, Mail, AlertCircle, Info, MapPin } from 'lucide-react';
import { CONTACT_EMAIL } from '@/lib/legal-api';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'SuperCampus Privacy Policy',
  description:
    'How SuperCampus collects, uses, shares and protects personal data in its campus app and web portal, and how to exercise your rights.',
  alternates: {
    canonical: 'https://supercampus.ai/privacy',
  },
};

const TOC: TocItem[] = [
  { id: 'intro', title: '1. Who We Are & Scope' },
  { id: 'collection', title: '2. Information We Collect' },
  { id: 'device', title: '3. Device Permissions & Technical Data' },
  { id: 'usage', title: '4. How We Use Information' },
  { id: 'sharing', title: '5. Who We Share It With' },
  { id: 'security', title: '6. How We Protect It' },
  { id: 'retention', title: '7. How Long We Keep It' },
  { id: 'rights', title: '8. Your Rights & Account Deletion' },
  { id: 'children', title: '9. Students Under 18' },
  { id: 'updates', title: '10. Changes to this Policy' },
  { id: 'contact', title: '11. Contact & Grievances' },
];

const linkStyle = { color: '#0f766e', fontWeight: 700 } as const;

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lead="This policy explains what personal data the SuperCampus app and web portal collect, why, who it is shared with, and the choices you have."
      badge="Data Protection & Privacy"
      lastUpdated="September 28, 2026"
      breadcrumbs={[{ label: 'Privacy Policy', href: '/privacy' }]}
      tocItems={TOC}
    >
      {/* 1. Who we are */}
      <LegalSection id="intro" number="1" title="Who We Are & Scope">
        <p>
          <strong>SuperCampus</strong> (supercampus.ai) is a campus management platform used by colleges
          for student accounts, admissions, attendance, timetables, marks, fees, gatepasses, hostel and
          mess, library, campus stores (canteen, stationery and laundry), announcements and
          notifications. You use it through the SuperCampus mobile app and web portal.
        </p>
        <p>
          This policy applies to students, parents and guardians, faculty, staff and admission applicants
          whose data is processed through SuperCampus. We process personal data in line with applicable
          Indian law, including the Digital Personal Data Protection Act, 2023.
        </p>
        <div className={`${styles.callout} ${styles.calloutInfo}`}>
          <Info size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>Your college decides what is recorded</strong>
            SuperCampus runs the platform on behalf of your college. Your college creates your account,
            decides which modules are used, and owns your academic and administrative records.
          </div>
        </div>
      </LegalSection>

      {/* 2. Information we collect */}
      <LegalSection id="collection" number="2" title="Information We Collect">
        <p>Depending on the modules your college uses, SuperCampus holds the following information:</p>

        <h3 className={styles.subSectionTitle}>A. Account & profile</h3>
        <ul className={styles.bulletList}>
          <li>Name, email address and mobile number.</li>
          <li>Register or roll number, department, programme, year of study and section.</li>
          <li>Residency details (day scholar or hosteller, hostel and room) and a profile photo, if added.</li>
          <li>
            Your password is stored only as a one-way hash; we cannot read it. A wallet PIN and its
            optional recovery word are also stored in a form that cannot be read back.
          </li>
        </ul>

        <h3 className={styles.subSectionTitle}>B. Parent and guardian details</h3>
        <ul className={styles.bulletList}>
          <li>
            Guardian name, relationship, mobile number and email, provided by your college, used to send
            gatepass approvals and campus updates to guardians.
          </li>
        </ul>

        <h3 className={styles.subSectionTitle}>C. Academic records</h3>
        <ul className={styles.bulletList}>
          <li>Class attendance, timetables and subject allocations.</li>
          <li>Assessment marks and results published by your faculty.</li>
        </ul>

        <h3 className={styles.subSectionTitle}>D. Campus services</h3>
        <ul className={styles.bulletList}>
          <li>
            <strong>Gatepass:</strong> leave-pass and outpass requests (destination, reason, dates),
            approvals, and gate entry and exit scans.
          </li>
          <li>
            <strong>Visitor passes:</strong> the visitor&apos;s name, mobile number and purpose of visit.
          </li>
          <li>
            <strong>Hostel:</strong> service requests (such as complaints or room changes) and mess meal
            tokens.
          </li>
          <li>
            <strong>Library:</strong> book loans, due dates, renewals and slot bookings.
          </li>
          <li>
            <strong>Campus stores:</strong> wallet balances, orders and wallet transactions for the
            canteen, stationery and laundry.
          </li>
          <li>
            <strong>Communication:</strong> announcements, and help requests or feedback you send through
            the app.
          </li>
        </ul>

        <h3 className={styles.subSectionTitle}>E. Payments</h3>
        <p>
          Tuition fees and wallet top-ups can be paid online through Razorpay. We record the payment
          reference, amount, purpose, status and time.
        </p>
        <div className={`${styles.callout} ${styles.calloutWarning}`}>
          <AlertCircle size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>We never see your card or UPI details</strong>
            Card numbers, CVV, UPI PINs and net-banking passwords are entered directly with Razorpay and
            are never sent to or stored by SuperCampus.
          </div>
        </div>

        <h3 className={styles.subSectionTitle}>F. Admission applicants</h3>
        <ul className={styles.bulletList}>
          <li>
            The details you enter in your college&apos;s application form, and a one-time code sent to your
            mobile by WhatsApp or SMS to open your application.
          </li>
        </ul>
      </LegalSection>

      {/* 3. Device permissions */}
      <LegalSection id="device" number="3" title="Device Permissions & Technical Data">
        <p>The mobile app asks for these permissions only when a feature needs them:</p>
        <ul className={styles.bulletList}>
          <li>
            <strong>Location (precise, only while in use):</strong> used only on the Gatepass screen to
            confirm you are on campus before your daily entry QR is issued. It is never collected in the
            background. The most recent position used for that check is stored with your day&apos;s
            entry pass.
          </li>
          <li>
            <strong>Camera:</strong> used to scan QR codes (for example at the gate, library or store
            counter). Camera images are not stored.
          </li>
          <li>
            <strong>Photos and files:</strong> only the files you choose to upload (such as a profile
            photo or an attachment), and to save receipts and reports you download.
          </li>
          <li>
            <strong>Notifications:</strong> a push notification token so we can send you alerts, and
            on-device reminders such as exam reminders.
          </li>
        </ul>
        <p>We also keep limited technical data needed to run the service securely:</p>
        <ul className={styles.bulletList}>
          <li>
            Your sign-in sessions and the device name used to sign in (SuperCampus allows one signed-in
            device at a time), your last sign-in time, and failed sign-in counts used to lock an account
            briefly after repeated wrong passwords.
          </li>
          <li>Server logs of requests and errors, used to keep the service secure and fix problems.</li>
        </ul>
        <p>
          The app contains no advertising, and no third-party analytics or crash-reporting tools.
        </p>
      </LegalSection>

      {/* 4. How we use information */}
      <LegalSection id="usage" number="4" title="How We Use Information">
        <ul className={styles.bulletList}>
          <li>To provide the campus services your college has enabled for you.</li>
          <li>To verify who you are, protect accounts and show each person only what their role allows.</li>
          <li>
            To send notifications: in-app and push notifications, emails (such as password reset links),
            and WhatsApp messages to guardians for gatepass approvals and updates.
          </li>
          <li>To process payments and show receipts.</li>
          <li>To answer help requests and fix problems.</li>
          <li>To meet legal obligations and respond to lawful requests.</li>
        </ul>
        <p>
          <strong>We do not sell your personal data, and we do not use it for advertising.</strong>
        </p>
      </LegalSection>

      {/* 5. Sharing */}
      <LegalSection id="sharing" number="5" title="Who We Share It With">
        <ul className={styles.bulletList}>
          <li>
            <strong>Your college:</strong> authorised staff such as administrators, faculty, class
            advisors, wardens, accountants, librarians, store operators and security see the data their
            role requires. Guardians see information about their own ward.
          </li>
          <li>
            <strong>Service providers</strong> that run parts of the service for us, and only for that
            purpose:
            <ul className={styles.bulletList} style={{ marginTop: '8px' }}>
              <li>Razorpay: online payments.</li>
              <li>Google Firebase Cloud Messaging: push notifications.</li>
              <li>Brevo: sending emails.</li>
              <li>Gallabox (and Twilio): WhatsApp messages; Twilio also sends SMS for admission applications.</li>
              <li>Cloudinary: storing photos and files you upload.</li>
              <li>
                An AI model provider: helps staff plan timetables and assists the admissions team; only the
                information needed for that task is sent.
              </li>
              <li>Our cloud server hosting provider.</li>
            </ul>
          </li>
          <li>
            <strong>When required by law:</strong> to comply with a court order or a lawful request from
            authorities, or to protect someone&apos;s safety.
          </li>
        </ul>
        <p>
          Some of these providers may process data outside India, under their own security and privacy
          commitments.
        </p>
      </LegalSection>

      {/* 6. Security */}
      <LegalSection id="security" number="6" title="How We Protect It">
        <ul className={styles.bulletList}>
          <li>All connections to the app and API use HTTPS (TLS).</li>
          <li>
            Passwords are stored as one-way hashes; sign-in tokens, QR tokens, one-time codes and wallet
            PINs are also stored hashed.
          </li>
          <li>Each college&apos;s data is kept in its own database, with role-based access inside it.</li>
          <li>
            Repeated wrong passwords lock the account briefly, and signing in on a new device signs out
            the previous one.
          </li>
        </ul>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          <em>
            No system is completely secure. Please use a strong password, never share it, and tell us
            straight away if you think your account has been misused.
          </em>
        </p>
      </LegalSection>

      {/* 7. Retention */}
      <LegalSection id="retention" number="7" title="How Long We Keep It">
        <ul className={styles.bulletList}>
          <li>Your account data is kept while you are a member of your college on SuperCampus.</li>
          <li>
            Academic records such as attendance and marks belong to your college and are kept for as
            long as your college requires.
          </li>
          <li>Payment records are kept for as long as tax and accounting laws require.</li>
          <li>
            When your account is deleted, personal data we are not required to keep is deleted or
            anonymised (see section 8).
          </li>
        </ul>
      </LegalSection>

      {/* 8. Rights & deletion */}
      <LegalSection id="rights" number="8" title="Your Rights & Account Deletion">
        <p>You can ask us to:</p>
        <ul className={styles.bulletList}>
          <li>tell you what personal data we hold about you and how it is used;</li>
          <li>correct or update inaccurate data;</li>
          <li>delete your account and personal data;</li>
          <li>withdraw consent where we rely on it; and</li>
          <li>address a grievance about how your data is handled.</li>
        </ul>
        <p>
          Many profile details are managed by your college, so some corrections are quicker through your
          college office. To request account deletion, use the deletion request page:
        </p>
        <div style={{ margin: '18px 0' }}>
          <Link href="/delete-account" className={styles.actionButton}>
            <span>Request Account Deletion</span>
            <ExternalLink size={14} />
          </Link>
        </div>
        <p>
          We first confirm the request comes from you. We then sign you out everywhere, disable your
          account and notification tokens, and delete or anonymise personal data we are not required to
          keep. Records your college or the law requires us to keep, such as academic records and
          payment records, are retained.
        </p>
      </LegalSection>

      {/* 9. Students under 18 */}
      <LegalSection id="children" number="9" title="Students Under 18">
        <p>
          SuperCampus is built for colleges. If a student is under 18, their account is created by the
          college, which is responsible for obtaining the consent of a parent or lawful guardian as
          required by law. We do not use anyone&apos;s data, including minors&apos;, for tracking,
          profiling or advertising.
        </p>
      </LegalSection>

      {/* 10. Changes */}
      <LegalSection id="updates" number="10" title="Changes to this Policy">
        <p>
          We may update this policy when the service or the law changes. We will change the &quot;Last
          updated&quot; date above and, for significant changes, tell you in the app.
        </p>
      </LegalSection>

      {/* 11. Contact */}
      <LegalSection id="contact" number="11" title="Contact & Grievances">
        <p>
          For privacy questions, requests about your data, or grievances, email us. We will confirm the
          request is yours and reply as soon as possible.
        </p>
        <div className={styles.callout} style={{ background: '#f8fafc' }}>
          <Mail size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>SuperCampus Grievance &amp; Privacy Contact</strong>
            <span>Email: </span>
            <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>
              {CONTACT_EMAIL}
            </a>
            <br />
            <span>More help: </span>
            <Link href="/contact" style={linkStyle}>
              Contact &amp; Support page
            </Link>
          </div>
        </div>
        <div className={styles.callout} style={{ background: '#f8fafc' }}>
          <MapPin size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            If you are not satisfied with our response, you may approach the Data Protection Board of
            India under the Digital Personal Data Protection Act, 2023.
          </div>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
