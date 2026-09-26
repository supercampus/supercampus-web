'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import styles from './legal.module.css';

export function LegalHeader() {
  const pathname = usePathname();

  const links = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms & Conditions' },
    { href: '/delete-account', label: 'Delete Account' },
    { href: '/contact', label: 'Contact & Support' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="SuperCampus Home">
          <div className={styles.logoBadge}>SC</div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>SuperCampus</span>
            <span className={styles.brandSub}>Campus ERP & CRM</span>
          </div>
        </Link>

        <nav className={styles.navLinks} aria-label="Legal & Support Navigation">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.headerActions}>
          <Link href="/" className={styles.actionButton}>
            <span>Student Portal</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
