import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout, TocItem } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import { ShieldAlert, Info, Mail } from 'lucide-react';
import { CONTACT_EMAIL } from '@/lib/legal-api';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'SuperCampus Terms & Conditions',
  description:
    'Terms & Conditions for using the SuperCampus app and web portal: accounts, acceptable use, payments, availability, liability and governing law.',
  alternates: {
    canonical: 'https://supercampus.ai/terms',
  },
};

const TOC: TocItem[] = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'service-desc', title: '2. The Service' },
  { id: 'user-accounts', title: '3. Your Account' },
  { id: 'institutional', title: '4. Your College’s Role' },
  { id: 'acceptable-use', title: '5. Acceptable Use' },
  { id: 'payments', title: '6. Payments & Wallets' },
  { id: 'ip', title: '7. Intellectual Property' },
  { id: 'availability', title: '8. Availability & Changes' },
  { id: 'third-parties', title: '9. Third-Party Services' },
  { id: 'termination', title: '10. Suspension & Termination' },
  { id: 'disclaimer', title: '11. Disclaimer' },
  { id: 'liability', title: '12. Limitation of Liability' },
  { id: 'changes', title: '13. Changes to these Terms' },
  { id: 'governing-law', title: '14. Governing Law & Jurisdiction' },
  { id: 'contact', title: '15. Contact' },
];

const linkStyle = { color: '#0f766e', fontWeight: 700 } as const;

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      lead="These Terms govern your use of the SuperCampus mobile app, web portal and related campus services."
      badge="Terms of Service"
      lastUpdated="September 28, 2026"
      breadcrumbs={[{ label: 'Terms & Conditions', href: '/terms' }]}
      tocItems={TOC}
    >
      {/* 1. Acceptance */}
      <LegalSection id="acceptance" number="1" title="Acceptance of Terms">
        <p>
          By signing in to or using <strong>SuperCampus</strong> (supercampus.ai and the SuperCampus
          mobile app), you agree to these Terms and to our{' '}
          <Link href="/privacy" style={linkStyle}>
            Privacy Policy
          </Link>
          . If you do not agree, please do not use SuperCampus.
        </p>
        <p>
          If you use SuperCampus on behalf of a college or other organisation, you confirm that you are
          authorised to accept these Terms for it.
        </p>
      </LegalSection>

      {/* 2. Service */}
      <LegalSection id="service-desc" number="2" title="The Service">
        <p>
          SuperCampus is a campus management platform provided to colleges. Depending on the modules your
          college enables, it lets you:
        </p>
        <ul className={styles.bulletList}>
          <li>view your profile and digital ID, attendance, timetable, and marks published by faculty;</li>
          <li>view fee details and pay tuition fees online;</li>
          <li>apply for leave passes and outpasses, use a daily campus entry QR, and invite visitors;</li>
          <li>use hostel services such as mess tokens and service requests;</li>
          <li>borrow and book from the library;</li>
          <li>order and pay from the campus canteen, stationery and laundry using a store wallet;</li>
          <li>read announcements, receive notifications, and send help requests.</li>
        </ul>
        <p>
          Staff use SuperCampus to manage these services, and prospective students use it to apply for
          admission.
        </p>
      </LegalSection>

      {/* 3. Accounts */}
      <LegalSection id="user-accounts" number="3" title="Your Account">
        <ul className={styles.bulletList}>
          <li>
            <strong>Accounts are issued by your college.</strong> Keep your details accurate and tell your
            college if something is wrong.
          </li>
          <li>
            <strong>Keep your password and wallet PIN secret.</strong> Do not let anyone else use your
            account. You are responsible for activity under your account.
          </li>
          <li>
            <strong>One device at a time.</strong> Signing in on a new device signs out the previous one.
            Repeated wrong passwords lock the account for a short time.
          </li>
          <li>
            If you think your account has been misused, change your password and contact us or your
            college straight away.
          </li>
        </ul>
      </LegalSection>

      {/* 4. College's role */}
      <LegalSection id="institutional" number="4" title="Your College’s Role">
        <ul className={styles.bulletList}>
          <li>Your college decides who gets an account, which modules are available, and each person&apos;s access.</li>
          <li>
            Attendance rules, marks, fee amounts, due dates, refunds, hostel and gatepass rules are set by
            your college, not by SuperCampus.
          </li>
          <li>Your college may suspend or change your access, for example when you graduate or leave.</li>
        </ul>
      </LegalSection>

      {/* 5. Acceptable use */}
      <LegalSection id="acceptable-use" number="5" title="Acceptable Use">
        <p>You must not:</p>
        <ul className={styles.bulletList}>
          <li>try to access accounts, data or systems you are not authorised to use, or bypass security;</li>
          <li>disrupt the service, or upload viruses or other harmful files;</li>
          <li>impersonate another person;</li>
          <li>
            alter or forge attendance, marks, gatepasses, QR codes, receipts or other records;
          </li>
          <li>post abusive, threatening or unlawful content; or</li>
          <li>copy, scrape or resell any part of the service or its data.</li>
        </ul>
        <div className={`${styles.callout} ${styles.calloutDanger}`}>
          <ShieldAlert size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>Tampering with records</strong>
            Attempts to falsify attendance, marks, gatepasses or payments may lead to your account being
            suspended and reported to your college.
          </div>
        </div>
      </LegalSection>

      {/* 6. Payments */}
      <LegalSection id="payments" number="6" title="Payments & Wallets">
        <ul className={styles.bulletList}>
          <li>
            Online payments (tuition fees and wallet top-ups) are processed by Razorpay. Your card and UPI
            details are entered with Razorpay and are not stored by SuperCampus.
          </li>
          <li>
            Fee amounts, due dates, late fees and refunds are decided by your college. Contact your
            college accounts office about them.
          </li>
          <li>
            Store wallet balances can be used only at your college&apos;s campus stores (canteen, stationery
            and laundry) on SuperCampus. Purchases need your wallet PIN.
          </li>
          <li>Receipts in the app confirm that a payment was recorded.</li>
        </ul>
      </LegalSection>

      {/* 7. IP */}
      <LegalSection id="ip" number="7" title="Intellectual Property">
        <p>
          The SuperCampus software, design and brand belong to SuperCampus. You receive a personal,
          non-transferable, revocable licence to use SuperCampus for its intended campus purposes. You may
          not copy, modify, reverse-engineer or redistribute the software.
        </p>
        <p>Your college&apos;s records and the content you submit remain yours or your college&apos;s.</p>
      </LegalSection>

      {/* 8. Availability */}
      <LegalSection id="availability" number="8" title="Availability & Changes">
        <p>
          We work to keep SuperCampus available, but it may sometimes be unavailable for maintenance,
          updates, or failures of networks or providers outside our control. We may add, change or remove
          features over time.
        </p>
      </LegalSection>

      {/* 9. Third parties */}
      <LegalSection id="third-parties" number="9" title="Third-Party Services">
        <p>
          Some features rely on third-party services, such as Razorpay for payments, WhatsApp for
          guardian messages, and push notification services. Their own terms and policies also apply to
          your use of those services, and we are not responsible for how they operate.
        </p>
      </LegalSection>

      {/* 10. Termination */}
      <LegalSection id="termination" number="10" title="Suspension & Termination">
        <p>We or your college may suspend or end your access if:</p>
        <ul className={styles.bulletList}>
          <li>you breach these Terms or your college&apos;s rules;</li>
          <li>you are no longer a student or staff member of the college; or</li>
          <li>the law requires it, or continued access puts the service or other users at risk.</li>
        </ul>
        <p>
          You can ask to delete your account at any time from the{' '}
          <Link href="/delete-account" style={linkStyle}>
            account deletion page
          </Link>
          .
        </p>
      </LegalSection>

      {/* 11. Disclaimer */}
      <LegalSection id="disclaimer" number="11" title="Disclaimer">
        <p>
          SuperCampus is provided &quot;as is&quot; and &quot;as available&quot;. To the extent permitted by
          law, we do not promise that it will always be uninterrupted or error-free. Your college&apos;s
          official records are the authoritative source for your academic standing.
        </p>
      </LegalSection>

      {/* 12. Liability */}
      <LegalSection id="liability" number="12" title="Limitation of Liability">
        <p>
          To the extent permitted by law, SuperCampus is not liable for indirect or consequential losses,
          or for losses caused by events outside our reasonable control, such as network, payment
          provider or hosting outages, or by the actions of other users. Nothing in these Terms limits
          liability that cannot be limited under applicable law.
        </p>
      </LegalSection>

      {/* 13. Changes */}
      <LegalSection id="changes" number="13" title="Changes to these Terms">
        <p>
          We may update these Terms. We will change the &quot;Last updated&quot; date above and, for
          significant changes, tell you in the app. Continuing to use SuperCampus after the change means
          you accept the updated Terms.
        </p>
      </LegalSection>

      {/* 14. Governing law */}
      <LegalSection id="governing-law" number="14" title="Governing Law & Jurisdiction">
        <p>
          These Terms are governed by the laws of India. The courts at Chennai, Tamil Nadu, have exclusive
          jurisdiction over any dispute arising from these Terms or your use of SuperCampus.
        </p>
        <div className={`${styles.callout} ${styles.calloutInfo}`}>
          <Info size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            A written agreement between SuperCampus and your college may contain additional terms that
            apply to that college.
          </div>
        </div>
      </LegalSection>

      {/* 15. Contact */}
      <LegalSection id="contact" number="15" title="Contact">
        <div className={styles.callout} style={{ background: '#f8fafc' }}>
          <Mail size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>Questions about these Terms</strong>
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
      </LegalSection>
    </LegalPageLayout>
  );
}
