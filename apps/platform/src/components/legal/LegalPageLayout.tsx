import React from 'react';
import { LegalHeader } from './LegalHeader';
import { LegalFooter } from './LegalFooter';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { Clock, Shield } from 'lucide-react';
import styles from './legal.module.css';

export interface TocItem {
  id: string;
  title: string;
}

interface LegalPageLayoutProps {
  title: string;
  lead: string;
  badge?: string;
  badgeType?: 'default' | 'warning' | 'danger';
  lastUpdated?: string;
  breadcrumbs: BreadcrumbItem[];
  tocItems?: TocItem[];
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  lead,
  badge = 'Official Policy',
  badgeType = 'default',
  lastUpdated = 'September 2026',
  breadcrumbs,
  tocItems,
  children,
}: LegalPageLayoutProps) {
  const badgeClass =
    badgeType === 'danger'
      ? styles.badgeDanger
      : badgeType === 'warning'
      ? styles.badgeWarning
      : styles.badge;

  return (
    <div className={styles.legalPage}>
      <LegalHeader />

      {/* Hero Header */}
      <section className={styles.hero} aria-labelledby="page-title">
        <div className={styles.heroInner}>
          <Breadcrumbs items={breadcrumbs} />

          <div className={badgeClass}>
            <Shield size={13} />
            <span>{badge}</span>
          </div>

          <h1 id="page-title" className={styles.heroTitle}>
            {title}
          </h1>

          <p className={styles.heroLead}>{lead}</p>

          <div className={styles.heroMeta}>
            <div className={styles.metaItem}>
              <Clock size={14} />
              <span>Effective Date: {lastUpdated}</span>
            </div>
            <div className={styles.metaItem}>
              <span>Domain:</span>
              <strong style={{ color: '#0f172a' }}>supercampus.ai</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className={styles.mainContainer}>
        {tocItems && tocItems.length > 0 ? (
          <div className={styles.contentGrid}>
            {/* Sticky Table of Contents on Desktop */}
            <aside className={styles.tocSidebar} aria-label="Table of Contents">
              <div className={styles.tocTitle}>Table of Contents</div>
              <ul className={styles.tocList}>
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className={styles.tocLink}>
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Document Body */}
            <article className={styles.contentCard}>{children}</article>
          </div>
        ) : (
          <div className={styles.singleColumnGrid}>{children}</div>
        )}
      </main>

      <LegalFooter />
    </div>
  );
}
