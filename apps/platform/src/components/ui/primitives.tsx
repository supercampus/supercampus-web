import React from 'react';

interface IconProps {
  path: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function Icon({ path, size = 18, color = 'currentColor', strokeWidth = 2, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={path} />
    </svg>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  color: string;
  className?: string;
}

export function Badge({ children, color, className = '' }: BadgeProps) {
  return (
    <span
      className={`sc-badge ${className}`}
      style={{ background: color + '22', color }}
    >
      {children}
    </span>
  );
}

interface StepperProps {
  steps: { label: string; state: 'done' | 'active' | 'pending'; num: string }[];
  direction?: 'horizontal' | 'vertical';
}

export function Stepper({ steps, direction = 'horizontal' }: StepperProps) {
  if (direction === 'vertical') {
    return (
      <div className="sc-stepper-v">
        {steps.map((s, i) => (
          <div key={i} className="sc-stepper-v__item">
            <div className="sc-stepper-v__track">
              <div className={`sc-stepper-v__dot sc-stepper-v__dot--${s.state}`}>{s.num}</div>
              {i < steps.length - 1 && <div className={`sc-stepper-v__line sc-stepper-v__line--${s.state === 'done' ? 'done' : 'pending'}`} />}
            </div>
            <div className="sc-stepper-v__content">
              <div className={`sc-stepper-v__label sc-stepper-v__label--${s.state}`}>{s.label}</div>
              {s.state === 'active' && <div className="sc-stepper-v__sub">In progress</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="sc-stepper-h">
      {steps.map((s, i) => (
        <div key={i} className="sc-stepper-h__item">
          <div className={`sc-stepper-h__dot sc-stepper-h__dot--${s.state}`}>{s.num}</div>
          <div className={`sc-stepper-h__label sc-stepper-h__label--${s.state}`}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <div className={`sc-card ${className}`} style={style}>
      {children}
    </div>
  );
}

interface SectionTitleProps { children: React.ReactNode }
export function SectionTitle({ children }: SectionTitleProps) {
  return <div className="sc-section-title">{children}</div>;
}

interface AppNoticeProps {
  icon?: string;
  iconColor?: string;
  children: React.ReactNode;
}
export function AppNotice({ children }: AppNoticeProps) {
  return (
    <div className="sc-app-notice">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9096a4" strokeWidth="2">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </svg>
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="sc-empty">
      <div className="sc-empty__icon">
        <Icon path={icon} size={24} color="#9096a4" />
      </div>
      <div className="sc-empty__title">{title}</div>
      {sub && <div className="sc-empty__sub">{sub}</div>}
    </div>
  );
}
