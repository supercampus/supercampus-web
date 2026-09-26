import React from 'react';
import styles from './legal.module.css';

interface LegalSectionProps {
  id: string;
  number?: string | number;
  title: string;
  children: React.ReactNode;
}

export function LegalSection({ id, number, title, children }: LegalSectionProps) {
  return (
    <section id={id} className={styles.legalSection} aria-labelledby={`heading-${id}`}>
      <header className={styles.sectionHeader}>
        {number && <span className={styles.sectionNumber}>{number}</span>}
        <h2 id={`heading-${id}`} className={styles.sectionTitle}>
          {title}
        </h2>
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}
