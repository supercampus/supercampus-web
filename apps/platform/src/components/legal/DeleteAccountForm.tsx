'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  Clock,
  KeyRound,
  Home,
  CreditCard,
  Coffee,
  BookOpen,
  ShieldAlert,
  CheckCircle,
  Mail,
} from 'lucide-react';
import { accountDeletionEmail, PRIVACY_EMAIL } from '@/lib/legal-api';
import { ConfirmationState } from './ConfirmationState';
import styles from './legal.module.css';

export function DeleteAccountForm() {
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [collegeName, setCollegeName] = useState('');
  const [reason, setReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [emailHref, setEmailHref] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please provide your registered institutional email or phone number.');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name as registered in the institution.');
      return;
    }

    if (!confirmed) {
      setError('You must check the confirmation box to proceed with an account deletion request.');
      return;
    }

    const href = accountDeletionEmail({
      identifier: identifier.trim(),
      fullName: fullName.trim(),
      role,
      collegeName: collegeName.trim() || undefined,
      reason: reason || undefined,
      additionalDetails: additionalDetails.trim() || undefined,
    });
    setEmailHref(href);
    window.location.href = href;
  }

  if (emailHref) {
    return (
      <div className={styles.formCard}>
        <ConfirmationState
          emailHref={emailHref}
          onReset={() => {
            setEmailHref(null);
            setConfirmed(false);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Distinction Section: Deactivation vs Personal Data Deletion vs Institutional Records */}
      <div className={styles.comparisonGrid}>
        <div className={`${styles.comparisonCard} ${styles.comparisonDeletable}`}>
          <h4>
            <CheckCircle size={18} />
            <span>Deleted or Anonymised</span>
          </h4>
          <ul>
            <li>Your sign-in access, password and all signed-in sessions</li>
            <li>Push notification tokens and device details</li>
            <li>Profile details such as your photo, phone number and preferences</li>
            <li>Your wallet PIN and recovery word</li>
            <li>Notification history and help requests you sent</li>
          </ul>
        </div>

        <div className={`${styles.comparisonCard} ${styles.comparisonRetained}`}>
          <h4>
            <ShieldAlert size={18} />
            <span>Kept by Your College or by Law</span>
          </h4>
          <ul>
            <li>Attendance, marks and results</li>
            <li>Fee payments, wallet transactions and receipts</li>
            <li>Gatepass and campus entry records</li>
            <li>Hostel and library records, including unreturned books</li>
          </ul>
        </div>
      </div>

      {/* Affected Services Callout */}
      <div className={styles.contentCard} style={{ marginBottom: '28px' }}>
        <h3 className={styles.subSectionTitle} style={{ marginTop: 0 }}>
          Services Affected by Account Deletion
        </h3>
        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
          Deleting your SuperCampus account ends your authenticated access across the platform. You
          will no longer be able to access the following campus services:
        </p>

        <div className={styles.moduleGrid}>
          <div className={styles.moduleCard}>
            <div className={styles.moduleIcon}>
              <Clock size={16} />
            </div>
            <div className={styles.moduleInfo}>
              <h4>Attendance & Marks</h4>
              <p>Your attendance, marks and results will no longer be visible to you in the app.</p>
            </div>
          </div>

          <div className={styles.moduleCard}>
            <div className={styles.moduleIcon}>
              <Calendar size={16} />
            </div>
            <div className={styles.moduleInfo}>
              <h4>Timetable & Schedule</h4>
              <p>You will not be able to view your class timetable.</p>
            </div>
          </div>

          <div className={styles.moduleCard}>
            <div className={styles.moduleIcon}>
              <KeyRound size={16} />
            </div>
            <div className={styles.moduleInfo}>
              <h4>Gatepass & Campus QR</h4>
              <p>You will not be able to apply for leave passes or outpasses, or get a campus entry QR.</p>
            </div>
          </div>

          <div className={styles.moduleCard}>
            <div className={styles.moduleIcon}>
              <Home size={16} />
            </div>
            <div className={styles.moduleInfo}>
              <h4>Hostel & Mess</h4>
              <p>You will lose access to mess tokens and hostel service requests.</p>
            </div>
          </div>

          <div className={styles.moduleCard}>
            <div className={styles.moduleIcon}>
              <CreditCard size={16} />
            </div>
            <div className={styles.moduleInfo}>
              <h4>Fees & Payments</h4>
              <p>You will not be able to view fee details, pay fees online, or open receipts in the app.</p>
            </div>
          </div>

          <div className={styles.moduleCard}>
            <div className={styles.moduleIcon}>
              <Coffee size={16} />
            </div>
            <div className={styles.moduleInfo}>
              <h4>Canteen & Stores</h4>
              <p>
                Canteen, stationery and laundry wallets close. Use or settle any remaining balance with
                your college before requesting deletion.
              </p>
            </div>
          </div>

          <div className={styles.moduleCard}>
            <div className={styles.moduleIcon}>
              <BookOpen size={16} />
            </div>
            <div className={styles.moduleInfo}>
              <h4>Library</h4>
              <p>You will not be able to borrow, renew or book through the app. Return any books first.</p>
            </div>
          </div>
        </div>

        <div className={`${styles.callout} ${styles.calloutWarning}`} style={{ margin: '16px 0 0' }}>
          <AlertTriangle size={18} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>Still studying at your college?</strong>
            Your college may need your account for official services. If you only want to stop using
            the app for a while, sign out instead, or check with your college office first.
          </div>
        </div>
      </div>

      {/* Account Deletion Request Form */}
      <div className={styles.formCard}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Account Deletion Request Form
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            This form prepares an email to {PRIVACY_EMAIL} with your details filled in. Your request
            reaches us once you send that email, and nothing is deleted before we have verified that
            the account is yours.
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
              <label htmlFor="del-identifier" className={styles.label}>
                <span>Registered Email or Phone Number</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <input
                id="del-identifier"
                type="text"
                className={styles.input}
                placeholder="e.g. student@college.edu or +91 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="del-fullname" className={styles.label}>
                <span>Full Name (as registered)</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <input
                id="del-fullname"
                type="text"
                className={styles.input}
                placeholder="e.g. Vishnu Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="del-role" className={styles.label}>
                <span>Your Role</span>
                <span className={styles.optionalTag}>Select one</span>
              </label>
              <select
                id="del-role"
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="parent">Parent / Guardian</option>
                <option value="faculty">Faculty / Teacher</option>
                <option value="staff">Staff / Administrator</option>
                <option value="alumni">Alumni</option>
                <option value="other">Other Campus User</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="del-college" className={styles.label}>
                <span>College / Institution Name</span>
                <span className={styles.optionalTag}>Optional</span>
              </label>
              <input
                id="del-college"
                type="text"
                className={styles.input}
                placeholder="e.g. MEC Chennai"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="del-reason" className={styles.label}>
                <span>Reason for Deletion</span>
                <span className={styles.optionalTag}>Optional</span>
              </label>
              <select
                id="del-reason"
                className={styles.select}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Please select a reason (optional)</option>
                <option value="graduated">Completed studies / Graduated</option>
                <option value="transferred">Transferred to another institution</option>
                <option value="duplicate">Duplicate or incorrect account</option>
                <option value="privacy">Privacy & personal data concerns</option>
                <option value="not_using">No longer using the mobile or web app</option>
                <option value="other">Other reason</option>
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="del-details" className={styles.label}>
                <span>Additional Comments</span>
                <span className={styles.optionalTag}>Optional</span>
              </label>
              <textarea
                id="del-details"
                className={styles.textarea}
                placeholder="Share any additional details regarding your request..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  required
                />
                <span className={styles.checkboxLabel}>
                  <strong>Required Confirmation: </strong>
                  I understand that deleting my account may remove my access to SuperCampus services
                  and that some information may be retained where required for legal, security,
                  financial, or institutional record-keeping purposes.
                </span>
              </label>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '12px' }}>
              <button type="submit" className={`${styles.submitBtn} ${styles.submitBtnDanger}`}>
                <Mail size={16} />
                <span>Continue in Email</span>
              </button>
            </div>
          </div>
        </form>

        <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: '20px 0 0' }}>
          No email app on this device? Write to{' '}
          <a href={`mailto:${PRIVACY_EMAIL}`} style={{ color: '#0f766e', fontWeight: 700 }}>
            {PRIVACY_EMAIL}
          </a>{' '}
          or visit our <Link href="/contact" style={{ color: '#0f766e', fontWeight: 700 }}>Contact Page</Link>.
        </p>
      </div>
    </div>
  );
}
