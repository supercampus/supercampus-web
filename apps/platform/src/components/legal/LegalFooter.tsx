import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import styles from './legal.module.css';

export function LegalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          {/* Brand Column */}
          <div className={styles.footerBrandCol}>
            <div className={styles.footerBrandHeading}>
              <span className={styles.footerLogoBadge}>SC</span>
              <span>SuperCampus</span>
            </div>
            <p>
              Modern all-in-one campus management platform (CRM + ERP) powering student accounts,
              admissions, attendance, academics, fees, gatepass, hostels, and campus services.
            </p>
            <div className={styles.footerContactItem}>
              <Mail size={14} />
              <a href="mailto:support@supercampus.ai">support@supercampus.ai</a>
            </div>
          </div>

          {/* Legal & Governance */}
          <div>
            <div className={styles.footerColTitle}>Legal & Privacy</div>
            <ul className={styles.footerLinkList}>
              <li>
                <Link href="/privacy" className={styles.footerLink}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={styles.footerLink}>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/delete-account" className={styles.footerLink}>
                  Delete Account
                </Link>
              </li>
              <li>
                <Link href="/contact" className={styles.footerLink}>
                  Data Protection Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus Services */}
          <div>
            <div className={styles.footerColTitle}>Platform Services</div>
            <ul className={styles.footerLinkList}>
              <li>
                <Link href="/" className={styles.footerLink}>
                  Student & Staff Portal
                </Link>
              </li>
              <li>
                <span className={styles.footerLink}>Attendance & Timetable</span>
              </li>
              <li>
                <span className={styles.footerLink}>Gatepass & Campus Access</span>
              </li>
              <li>
                <span className={styles.footerLink}>Fees & Payment Clearance</span>
              </li>
              <li>
                <span className={styles.footerLink}>Hostel & Dining Services</span>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <div className={styles.footerColTitle}>Support Channels</div>
            <ul className={styles.footerLinkList}>
              <li>
                <Link href="/contact" className={styles.footerLink}>
                  Help & Contact Center
                </Link>
              </li>
              <li>
                <a href="mailto:privacy@supercampus.ai" className={styles.footerLink}>
                  privacy@supercampus.ai
                </a>
              </li>
              <li>
                <a href="mailto:support@supercampus.ai" className={styles.footerLink}>
                  support@supercampus.ai
                </a>
              </li>
              <li>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Institutional records managed by partner colleges
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.footerBottom}>
          <div>
            © {currentYear} SuperCampus (supercampus.ai). All rights reserved.
          </div>
          <div className={styles.footerBottomLinks}>
            <Link href="/privacy" className={styles.footerLink}>
              Privacy
            </Link>
            <Link href="/terms" className={styles.footerLink}>
              Terms
            </Link>
            <Link href="/delete-account" className={styles.footerLink}>
              Account Deletion
            </Link>
            <Link href="/contact" className={styles.footerLink}>
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
