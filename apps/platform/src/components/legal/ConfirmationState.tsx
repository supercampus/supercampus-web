import React from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, HelpCircle } from 'lucide-react';
import { PRIVACY_EMAIL } from '@/lib/legal-api';
import styles from './legal.module.css';

interface ConfirmationStateProps {
  /** The pre-filled deletion request email, so it can be reopened. */
  emailHref: string;
  onReset?: () => void;
}

/**
 * Shown after the deletion form hands off to email. The request has not been
 * received yet at this point, so this screen must not say it was submitted.
 */
export function ConfirmationState({ emailHref, onReset }: ConfirmationStateProps) {
  return (
    <div className={styles.confirmationCard} role="status" aria-live="polite">
      <div className={styles.confirmationIconWrap}>
        <Mail size={36} />
      </div>

      <h3 className={styles.confirmationTitle}>Send the email to finish your request</h3>
      <p className={styles.confirmationLead}>
        Your email app should have opened with the deletion request filled in, addressed to{' '}
        <strong>{PRIVACY_EMAIL}</strong>. We receive the request only once you send that email.
        If nothing opened, use the button below or write to that address yourself.
      </p>

      <div className={styles.timelineCard}>
        <div className={styles.timelineItem}>
          <div className={styles.timelineStep}>1</div>
          <div className={styles.timelineContent}>
            <h5>Send the email</h5>
            <p>Send it from the email address registered with your SuperCampus account if you can.</p>
          </div>
        </div>

        <div className={styles.timelineItem}>
          <div className={styles.timelineStep}>2</div>
          <div className={styles.timelineContent}>
            <h5>Identity verification</h5>
            <p>
              We reply to confirm the account belongs to you. Nothing is deleted before this step.
            </p>
          </div>
        </div>

        <div className={styles.timelineItem}>
          <div className={styles.timelineStep}>3</div>
          <div className={styles.timelineContent}>
            <h5>Institutional records check and deletion</h5>
            <p>
              Your college confirms which statutory records (transcripts, fee receipts, hall tickets)
              must be kept. Your sign-in credentials, profile details and device sessions are then
              deleted, and we confirm by email.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.confirmationActions}>
        <a href={emailHref} className={styles.actionButton}>
          <span>Open the Email Again</span>
          <ArrowRight size={14} />
        </a>
        <Link href="/contact" className={styles.outlineBtn}>
          <HelpCircle size={15} />
          <span>Need Help? Contact Support</span>
        </Link>
        {onReset && (
          <button type="button" onClick={onReset} className={styles.outlineBtn}>
            Edit My Details
          </button>
        )}
      </div>
    </div>
  );
}
