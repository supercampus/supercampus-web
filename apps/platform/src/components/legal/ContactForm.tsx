'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Shield,
  Trash2,
  Building,
  Send,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  CONTACT_EMAIL,
  contactInquiryEmail,
  type ContactMessagePayload,
} from '@/lib/legal-api';
import styles from './legal.module.css';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<ContactMessagePayload['category']>('general');
  const [college, setCollege] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<{ to: string; href: string } | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const prepared = contactInquiryEmail({
      name: name.trim(),
      email: email.trim(),
      category,
      college: college.trim() || undefined,
      subject: subject.trim(),
      message: message.trim(),
    });
    setHandoff(prepared);
    window.location.href = prepared.href;
  }

  return (
    <div>
      {/* 4 Dedicated Support Channel Cards */}
      <div className={styles.contactChannelsGrid}>
        <div className={styles.channelCard}>
          <div className={styles.channelIcon}>
            <Mail size={22} />
          </div>
          <h3 className={styles.channelTitle}>App Support</h3>
          <p className={styles.channelDesc}>
            Problems signing in, resetting your password, or using the SuperCampus app or web portal.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.channelAction}>
            {CONTACT_EMAIL}
            <ArrowRight size={13} />
          </a>
        </div>

        <div className={styles.channelCard}>
          <div className={styles.channelIcon}>
            <Shield size={22} />
          </div>
          <h3 className={styles.channelTitle}>Privacy & Grievances</h3>
          <p className={styles.channelDesc}>
            Questions about your personal data, requests to access or correct it, and privacy
            complaints.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.channelAction}>
            {CONTACT_EMAIL}
            <ArrowRight size={13} />
          </a>
        </div>

        <div className={styles.channelCard}>
          <div className={styles.channelIcon}>
            <Trash2 size={22} />
          </div>
          <h3 className={styles.channelTitle}>Account Deletion</h3>
          <p className={styles.channelDesc}>
            Need to delete your SuperCampus student or staff account and request data purging?
          </p>
          <Link href="/delete-account" className={styles.channelAction}>
            Go to Account Deletion
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className={styles.channelCard}>
          <div className={styles.channelIcon}>
            <Building size={22} />
          </div>
          <h3 className={styles.channelTitle}>Institutional Support</h3>
          <p className={styles.channelDesc}>
            Official grades, attendance condonation, admission status, or hostel fees must be handled
            directly with your college administration.
          </p>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            Reach your College Office / HOD
          </span>
        </div>
      </div>

      {/* Contact Inquiry Form */}
      <div className={styles.formCard}>
        {handoff ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }} role="status" aria-live="polite">
            <div className={styles.confirmationIconWrap}>
              <Mail size={36} />
            </div>
            <h3 className={styles.confirmationTitle}>Send the email to reach us</h3>
            <p className={styles.confirmationLead}>
              Your email app should have opened with your message addressed to{' '}
              <strong>{handoff.to}</strong>. We receive it once you send it. If nothing opened, use the
              button below or write to that address yourself.
            </p>
            <div className={styles.confirmationActions}>
              <a href={handoff.href} className={styles.actionButton}>
                <span>Open the Email Again</span>
                <ArrowRight size={14} />
              </a>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => setHandoff(null)}
              >
                Edit My Message
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Send Us a Message
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                This form prepares an email to {CONTACT_EMAIL} with your details filled in. Your
                message reaches us once you send it, and we reply by email.
              </p>
            </div>

            {error && (
              <div className={`${styles.callout} ${styles.calloutDanger}`} role="alert" style={{ marginTop: 0 }}>
                <AlertTriangle size={18} className={styles.calloutIcon} />
                <div className={styles.calloutText}>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="contact-name" className={styles.label}>
                    <span>Your Name</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Priyadarshini Rao"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="contact-email" className={styles.label}>
                    <span>Email Address</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    className={styles.input}
                    placeholder="e.g. name@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="contact-category" className={styles.label}>
                    <span>Inquiry Topic</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <select
                    id="contact-category"
                    className={styles.select}
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as ContactMessagePayload['category'])
                    }
                  >
                    <option value="general">General Application Support</option>
                    <option value="privacy">Privacy & Data Protection Inquiry</option>
                    <option value="deletion">Account Deletion Assistance</option>
                    <option value="institutional">College / Institution Coordination</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="contact-college" className={styles.label}>
                    <span>College / Campus (Optional)</span>
                    <span className={styles.optionalTag}>Optional</span>
                  </label>
                  <input
                    id="contact-college"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. MEC Chennai"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="contact-subject" className={styles.label}>
                    <span>Subject</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    className={styles.input}
                    placeholder="Brief description of your question or issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="contact-message" className={styles.label}>
                    <span>Message</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    className={styles.textarea}
                    placeholder="Please include relevant details such as your student roll ID or device type..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '12px' }}>
                  <button type="submit" className={styles.submitBtn}>
                    <Send size={15} />
                    <span>Continue in Email</span>
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
