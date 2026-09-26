import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout, TocItem } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import { ShieldAlert, Info, Mail } from 'lucide-react';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'SuperCampus Terms & Conditions',
  description:
    'Terms & Conditions for SuperCampus: acceptable use, institutional accounts, payments, intellectual property, service availability, and liability.',
  alternates: {
    canonical: 'https://supercampus.ai/terms',
  },
};

const TOC: TocItem[] = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'service-desc', title: '2. Description of Service' },
  { id: 'user-accounts', title: '3. User Accounts & Security' },
  { id: 'institutional', title: '4. Institutional Governance' },
  { id: 'acceptable-use', title: '5. Acceptable Use & Conduct' },
  { id: 'payments', title: '6. Fee Payments & Billing' },
  { id: 'ip', title: '7. Intellectual Property Rights' },
  { id: 'availability', title: '8. Service Availability & Maintenance' },
  { id: 'third-parties', title: '9. Third-Party Integrations' },
  { id: 'termination', title: '10. Suspension & Termination' },
  { id: 'disclaimer', title: '11. Warranty Disclaimer' },
  { id: 'liability', title: '12. Limitation of Liability' },
  { id: 'changes', title: '13. Changes to these Terms' },
  { id: 'governing-law', title: '14. Governing Law & Jurisdiction' },
  { id: 'contact', title: '15. Contact Information' },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      lead="These Terms & Conditions govern your access to and use of the SuperCampus platform, student mobile applications, faculty portals, and associated campus management digital services."
      badge="Terms of Service"
      lastUpdated="September 24, 2026"
      breadcrumbs={[{ label: 'Terms & Conditions', href: '/terms' }]}
      tocItems={TOC}
    >
      {/* 1. Acceptance */}
      <LegalSection id="acceptance" number="1" title="Acceptance of Terms">
        <p>
          By creating an account, downloading our mobile applications, logging into the web portal, or
          otherwise using <strong>SuperCampus</strong> (available via{' '}
          <code className={styles.refBadge} style={{ padding: '2px 8px', fontSize: '13px' }}>
            supercampus.ai
          </code>{' '}
          and related digital domains), you agree to be bound by these Terms &amp; Conditions and our
          accompanying{' '}
          <Link href="/privacy" style={{ color: '#0f766e', fontWeight: 700 }}>
            Privacy Policy
          </Link>.
        </p>
        <p>
          If you do not agree to these Terms, you must not access or use the SuperCampus platform. If you
          are using the service on behalf of an educational institution, department, or student organization,
          you represent and warrant that you have the authority to bind that entity to these Terms.
        </p>
      </LegalSection>

      {/* 2. Description of the Service */}
      <LegalSection id="service-desc" number="2" title="Description of the Service">
        <p>
          SuperCampus is a comprehensive, multi-tenant educational campus management solution
          incorporating student CRM and institutional ERP capabilities. The platform provides digital
          tools including, but not limited to:
        </p>
        <ul className={styles.bulletList}>
          <li>Student, faculty, and administrative profiles with digital ID credentials.</li>
          <li>Attendance tracking, classroom rosters, and condonation compliance monitoring.</li>
          <li>Weekly course timetables, exam schedules, and academic record publication.</li>
          <li>Fee payment facilitation, invoice displays, and digital transaction receipts.</li>
          <li>Hostel room allotments, dining mess records, and night roll-call verifications.</li>
          <li>Gatepass approvals, digital QR campus pass verification, and visitor management.</li>
          <li>Library catalog searching, book issue tracking, and document certificate requests.</li>
          <li>Campus canteen pre-ordering, digital tokens, and institutional announcement circulars.</li>
        </ul>
      </LegalSection>

      {/* 3. User Accounts */}
      <LegalSection id="user-accounts" number="3" title="User Accounts & Security">
        <p>To access SuperCampus features, you must maintain an authenticated account:</p>
        <ul className={styles.bulletList}>
          <li>
            <strong>Accurate Information:</strong> You agree to provide truthful, accurate, and current
            information during enrollment and to keep your institutional profile details updated.
          </li>
          <li>
            <strong>Account Security:</strong> You are responsible for safeguarding the credentials
            used to access your account, including passwords, OTPs, and biometric authentication keys.
          </li>
          <li>
            <strong>Account Responsibility:</strong> You are solely responsible for any activity or
            actions conducted under your credentials, whether authorized by you or not.
          </li>
          <li>
            <strong>Prohibition of Sharing:</strong> You must not permit third parties or fellow students
            to use your personal credentials. You must notify SuperCampus or your college administration
            immediately upon discovering any unauthorized use.
          </li>
        </ul>
      </LegalSection>

      {/* 4. Institutional Accounts */}
      <LegalSection id="institutional" number="4" title="Institutional Accounts & Governance">
        <p>
          SuperCampus accounts are deployed in coordination with participating colleges and universities.
          Certain privileges, modules, and academic records are governed by institutional administrators:
        </p>
        <ul className={styles.bulletList}>
          <li>
            Your institution determines student eligibility, departmental enrollment, and access permissions.
          </li>
          <li>
            Official marks, attendance thresholds, fee schedules, and hostel rules are set by your college,
            not by SuperCampus.
          </li>
          <li>
            Campus administrators retain the right to suspend or adjust user access based on institutional
            disciplinary codes, graduation, or academic status changes.
          </li>
        </ul>
      </LegalSection>

      {/* 5. Acceptable Use */}
      <LegalSection id="acceptable-use" number="5" title="Acceptable Use & Conduct">
        <p>
          You agree to use SuperCampus strictly for lawful educational and campus operational purposes.
          You must NOT, under any circumstances:
        </p>
        <ul className={styles.bulletList}>
          <li>
            <strong>Attempt Unauthorized Access:</strong> Probe, scan, or test the vulnerability of any
            system or network, or breach or circumvent any security or authentication controls.
          </li>
          <li>
            <strong>Disrupt or Abuse Services:</strong> Interfere with or disrupt the access of any user,
            host, or network, including transmitting denial-of-service attacks, viruses, or worms.
          </li>
          <li>
            <strong>Upload Malicious Content:</strong> Transmit software viruses, trojans, worms, or any
            files designed to disrupt, damage, or limit the functionality of computer software or hardware.
          </li>
          <li>
            <strong>Impersonate Others:</strong> Impersonate another student, faculty member, administrator,
            or representative of SuperCampus or your college.
          </li>
          <li>
            <strong>Falsify or Manipulate Records:</strong> Alter, forge, or manipulate attendance logs,
            internal marks, exam scores, gatepass approvals, QR tokens, or payment receipts.
          </li>
          <li>
            <strong>Harassment & Misconduct:</strong> Post or distribute abusive, defamatory, harassing,
            or threatening content through campus notice boards, grievance portals, or messaging channels.
          </li>
          <li>
            <strong>Commercial Exploitation:</strong> Resell, scrape, copy, or commercially exploit any
            portion of the software or student directories without express written permission.
          </li>
        </ul>
        <div className={`${styles.callout} ${styles.calloutDanger}`}>
          <ShieldAlert size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>Zero Tolerance for Academic Falsification</strong>
            Any attempt to tamper with academic grades, falsify attendance records, or forge gatepass
            authorizations will result in immediate account termination and formal escalation to college
            disciplinary authorities.
          </div>
        </div>
      </LegalSection>

      {/* 6. Payments */}
      <LegalSection id="payments" number="6" title="Fee Payments & Billing">
        <p>
          When you pay college fees (tuition, examination fees, hostel rent, transport, or canteen tokens)
          through SuperCampus:
        </p>
        <ul className={styles.bulletList}>
          <li>
            <strong>Third-Party Processors:</strong> Payment transactions are executed through authorized,
            regulated third-party payment gateways.
          </li>
          <li>
            <strong>Credential Security:</strong> SuperCampus does not store sensitive payment credentials,
            card numbers, CVV codes, UPI PINs, or net banking passwords.
          </li>
          <li>
            <strong>Fee Amounts & Policies:</strong> All fee amounts, late fee surcharges, due dates, and
            refund policies are governed exclusively by your educational institution.
          </li>
          <li>
            <strong>Transaction Records:</strong> Digital receipts generated by the app serve as
            acknowledgments of payment processing and are reconciled directly with your college accounts office.
          </li>
        </ul>
      </LegalSection>

      {/* 7. Intellectual Property */}
      <LegalSection id="ip" number="7" title="Intellectual Property Rights">
        <p>
          The SuperCampus platform, including its software codebase, algorithms, user interface designs,
          graphics, logos, typography, visual layouts, and documentation, is the proprietary property
          of SuperCampus and its licensors, protected by intellectual property laws.
        </p>
        <p>
          We grant you a personal, non-exclusive, non-transferable, revocable license to access and use
          the platform for educational campus management in accordance with these Terms. You may not
          decompile, reverse-engineer, modify, or create derivative works of any part of the software.
        </p>
      </LegalSection>

      {/* 8. Availability & Maintenance */}
      <LegalSection id="availability" number="8" title="Service Availability & Maintenance">
        <p>
          While we strive for 99.9% platform availability, SuperCampus services may occasionally be
          interrupted or delayed due to:
        </p>
        <ul className={styles.bulletList}>
          <li>Scheduled system maintenance, database upgrades, and security patch deployments.</li>
          <li>Unanticipated hardware failures, power outages, or third-party cloud infrastructure outages.</li>
          <li>Campus local network interruptions or telecommunications carrier disruptions.</li>
          <li>Force majeure events beyond reasonable commercial control.</li>
        </ul>
        <p>
          Where feasible, scheduled maintenance will be communicated to campus administrators in advance.
        </p>
      </LegalSection>

      {/* 9. Third-Party Services */}
      <LegalSection id="third-parties" number="9" title="Third-Party Integrations">
        <p>
          SuperCampus may integrate with third-party software, such as cloud storage, map tile providers,
          SMS relays, and institutional single-sign-on (SSO) systems. Your use of such third-party
          services may be subject to additional terms and privacy policies issued by those providers.
          SuperCampus is not responsible for the performance or terms of third-party external services.
        </p>
      </LegalSection>

      {/* 10. Suspension & Termination */}
      <LegalSection id="termination" number="10" title="Account Suspension & Termination">
        <p>We or your educational institution may suspend or terminate your account access if:</p>
        <ul className={styles.bulletList}>
          <li>You materially or repeatedly breach any provision of these Terms or the Student Code of Conduct.</li>
          <li>Your official enrollment or employment with the partner institution terminates or expires.</li>
          <li>Required by applicable legal, regulatory, or law enforcement mandates.</li>
          <li>Continued access creates demonstrable security, legal, or operational vulnerabilities for the platform.</li>
        </ul>
        <p>
          You may also voluntarily request deletion of your account at any time via our{' '}
          <Link href="/delete-account" style={{ color: '#0f766e', fontWeight: 700 }}>
            Account Deletion Page
          </Link>.
        </p>
      </LegalSection>

      {/* 11. Disclaimer */}
      <LegalSection id="disclaimer" number="11" title="Disclaimer of Warranties">
        <p>
          SuperCampus and its associated software are provided on an &quot;AS IS&quot; and &quot;AS
          AVAILABLE&quot; basis, without warranties of any kind, whether express or implied, including
          implied warranties of merchantability, fitness for a particular academic purpose, or non-infringement.
        </p>
        <p>
          We do not guarantee that the services will always be completely uninterrupted, secure, error-free,
          or that defects will be corrected immediately. Official academic standing remains verified
          by the partner college&apos;s physical and institutional records.
        </p>
      </LegalSection>

      {/* 12. Limitation of Liability */}
      <LegalSection id="liability" number="12" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, SuperCampus, its directors, employees,
          partners, and agents shall not be liable for any indirect, incidental, special, consequential,
          or punitive damages, including loss of data, profits, goodwill, academic standing, or other
          intangible losses resulting from:
        </p>
        <ul className={styles.bulletList}>
          <li>Your access to, use of, or inability to access or use the platform.</li>
          <li>Any conduct, communications, or content of any student or third party on the platform.</li>
          <li>Unauthorized access, alteration, or transmission of your records.</li>
          <li>Downtime or failure of third-party telecommunications, payment, or cloud providers.</li>
        </ul>
      </LegalSection>

      {/* 13. Changes to Terms */}
      <LegalSection id="changes" number="13" title="Changes to these Terms">
        <p>
          We reserve the right to revise or update these Terms &amp; Conditions from time to time.
          Substantial changes will be communicated via in-portal notices or emails. Your continued use
          of SuperCampus after the effective date of revisions constitutes your agreement to the modified Terms.
        </p>
      </LegalSection>

      {/* 14. Governing Law */}
      <LegalSection id="governing-law" number="14" title="Governing Law & Dispute Resolution">
        <p>
          These Terms shall be interpreted, construed, and enforced in accordance with the laws of the
          applicable jurisdiction, without regard to its conflict of law principles.
        </p>
        <div className={`${styles.callout} ${styles.calloutInfo}`}>
          <Info size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>Jurisdiction Specification:</strong>
            <code>[Applicable jurisdiction to be specified]</code>
            <p style={{ marginTop: '6px', fontSize: '13px' }}>
              Institutional master service contracts between SuperCampus and partner universities may
              specify localized legal jurisdictions as agreed in the relevant enterprise agreement.
            </p>
          </div>
        </div>
      </LegalSection>

      {/* 15. Contact */}
      <LegalSection id="contact" number="15" title="Contact & Legal Office">
        <p>For questions or formal legal notices concerning these Terms &amp; Conditions, contact us at:</p>
        <div className={styles.callout} style={{ background: '#f8fafc' }}>
          <Mail size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>SuperCampus Legal Office</strong>
            <span>Legal Inquiries: </span>
            <a href="mailto:support@supercampus.ai" style={{ color: '#0f766e', fontWeight: 700 }}>
              support@supercampus.ai
            </a>
            <br />
            <span>Platform Domain: </span>
            <strong>supercampus.ai</strong>
            <br />
            <span>Account Help: </span>
            <Link href="/contact" style={{ color: '#0f766e', fontWeight: 700 }}>
              Visit Contact & Support Page
            </Link>
          </div>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
