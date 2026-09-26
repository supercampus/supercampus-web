import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './legal.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol
        className={styles.breadcrumbs}
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          style={{ display: 'inline-flex', alignItems: 'center' }}
        >
          <Link href="/" className={styles.breadcrumbLink} itemProp="item">
            <span itemProp="name">SuperCampus</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const position = index + 2;

          return (
            <React.Fragment key={item.label}>
              <li aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <ChevronRight size={12} className={styles.breadcrumbSep} />
              </li>
              <li
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                {item.href && !isLast ? (
                  <Link href={item.href} className={styles.breadcrumbLink} itemProp="item">
                    <span itemProp="name">{item.label}</span>
                  </Link>
                ) : (
                  <span className={styles.breadcrumbCurrent} itemProp="name" aria-current="page">
                    {item.label}
                  </span>
                )}
                <meta itemProp="position" content={String(position)} />
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
