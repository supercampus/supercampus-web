'use client';

import React, { useMemo, useState } from 'react';
import { Badge, Card, Icon } from '@/components/ui/primitives';
import { ICONS } from '@/lib/data';
import type { BookingSelection, LibraryBooking } from '@/lib/library-bookings';
import {
  LIBRARY_BOOKINGS_SEED,
  MONTHS,
  createBooking,
  getAvailability,
  getCheckInStatus,
  getDaysInMonth,
  getMonthLabel,
  padTime,
} from '@/lib/library-bookings';

type ViewMode = 'feed' | 'book' | 'qr';
type PickerTarget = 'date' | 'month' | 'startHour' | 'startMinute' | 'endHour' | 'endMinute';

const statusColors: Record<LibraryBooking['status'], string> = {
  Active: '#10b981',
  Upcoming: '#3b82f6',
  Completed: '#9096a4',
};

const initialSelection: BookingSelection = {
  date: 13,
  month: 8,
  startHour: 10,
  startMinute: 0,
  endHour: 12,
  endMinute: 0,
  description: '',
};

function getPickerOptions(target: PickerTarget, selection: BookingSelection) {
  if (target === 'date') {
    return Array.from({ length: getDaysInMonth(selection.month) }, (_, index) => ({
      value: index + 1,
      label: padTime(index + 1),
    }));
  }

  if (target === 'month') {
    return MONTHS.map((month) => ({ value: month.value, label: month.short }));
  }

  if (target === 'startMinute' || target === 'endMinute') {
    return [0, 15, 30, 45].map((minute) => ({ value: minute, label: padTime(minute) }));
  }

  return Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: padTime(hour) }));
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="sc-library-field-label">{children}</div>;
}

function SegmentedBox({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`sc-library-segment ${active ? 'sc-library-segment--active' : ''}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function WheelPicker({
  target,
  selection,
  onChange,
}: {
  target: PickerTarget;
  selection: BookingSelection;
  onChange: (target: PickerTarget, value: number) => void;
}) {
  const options = getPickerOptions(target, selection);
  const selectedValue = selection[target];

  return (
    <div className="sc-library-wheel" role="listbox" aria-label="Picker options">
      {options.map((option) => (
        <button
          key={`${target}-${option.value}`}
          className={`sc-library-wheel__item ${selectedValue === option.value ? 'sc-library-wheel__item--selected' : ''}`}
          onClick={() => onChange(target, option.value)}
          type="button"
          aria-pressed={selectedValue === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function QrGraphic({ booking }: { booking: LibraryBooking }) {
  const payload = booking.id.replace(/[^A-Z0-9]/g, '');
  const cells = Array.from({ length: 49 }, (_, index) => {
    const char = payload.charCodeAt(index % payload.length);
    return (char + index + Math.floor(index / 7)) % 3 !== 0;
  });

  return (
    <div className="sc-library-qr" aria-label={`Check-in QR for ${booking.id}`}>
      <svg viewBox="0 0 132 132" role="img">
        <rect width="132" height="132" fill="#ffffff" />
        {[0, 92].map((x) => (
          <g key={`top-${x}`} fill="#050505">
            <rect x={x + 8} y="8" width="32" height="32" />
            <rect x={x + 16} y="16" width="16" height="16" fill="#ffffff" />
            <rect x={x + 21} y="21" width="6" height="6" />
          </g>
        ))}
        <g fill="#050505">
          <rect x="8" y="92" width="32" height="32" />
          <rect x="16" y="100" width="16" height="16" fill="#ffffff" />
          <rect x="21" y="105" width="6" height="6" />
        </g>
        <g fill="#050505">
          {cells.map((isFilled, index) => {
            if (!isFilled) return null;
            const x = 48 + (index % 7) * 10;
            const y = 48 + Math.floor(index / 7) * 10;
            return <rect key={index} x={x} y={y} width="7" height="7" rx="1" />;
          })}
          <rect x="64" y="14" width="8" height="18" />
          <rect x="78" y="36" width="8" height="8" />
          <rect x="104" y="70" width="18" height="8" />
          <rect x="88" y="104" width="8" height="18" />
        </g>
      </svg>
    </div>
  );
}

function BookingCard({
  booking,
  expanded,
  onToggle,
  onShowQr,
}: {
  booking: LibraryBooking;
  expanded: boolean;
  onToggle: () => void;
  onShowQr: () => void;
}) {
  return (
    <Card className={`sc-library-booking-card ${expanded ? 'sc-library-booking-card--expanded' : ''}`}>
      <button className="sc-library-booking-card__summary" onClick={onToggle} type="button" aria-expanded={expanded}>
        <div className="sc-library-booking-card__name">{booking.libraryName}</div>
        <div className="sc-library-booking-card__meta">{booking.dateLabel}</div>
        <div className="sc-library-booking-card__time">
          {booking.startTime} - {booking.endTime}
        </div>
        <Badge color={statusColors[booking.status]}>{booking.status}</Badge>
      </button>

      {expanded && (
        <div className="sc-library-booking-card__details">
          <div className="sc-library-detail-grid">
            <div>
              <span>Seat</span>
              <strong>{booking.seat}</strong>
            </div>
            <div>
              <span>Zone</span>
              <strong>{booking.zone}</strong>
            </div>
            <div>
              <span>Availability</span>
              <strong>{Math.max(0, booking.capacityTotal - booking.capacityBooked)} open</strong>
            </div>
          </div>
          <div className="sc-library-rules">
            {booking.rules.map((rule) => (
              <div key={rule}>{rule}</div>
            ))}
          </div>
          <button className="sc-btn sc-btn--primary" onClick={onShowQr} type="button">
            Show Check-In QR
          </button>
        </div>
      )}
    </Card>
  );
}

function BookingWindow({
  selection,
  pickerTarget,
  availability,
  onBack,
  onConfirm,
  onOpenPicker,
  onChangeSelection,
  onChangeDescription,
}: {
  selection: BookingSelection;
  pickerTarget: PickerTarget | null;
  availability: ReturnType<typeof getAvailability>;
  onBack: () => void;
  onConfirm: () => void;
  onOpenPicker: (target: PickerTarget) => void;
  onChangeSelection: (target: PickerTarget, value: number) => void;
  onChangeDescription: (value: string) => void;
}) {
  return (
    <div className="sc-library-subpage">
      <div className="sc-library-nav">
        <button className="sc-library-icon-btn" onClick={onBack} type="button" aria-label="Back">
          <Icon path="M15 18l-6-6 6-6" size={18} />
        </button>
        <div>
          <div className="sc-library-nav__title">Book Slot</div>
          <div className="sc-library-nav__sub">Central Library - Reading Hall</div>
        </div>
      </div>

      <Card className="sc-library-booking-window">
        <FieldLabel>Date</FieldLabel>
        <div className="sc-library-segment-row">
          <SegmentedBox label={padTime(selection.date)} active={pickerTarget === 'date'} onClick={() => onOpenPicker('date')} />
          <SegmentedBox label={getMonthLabel(selection.month)} active={pickerTarget === 'month'} onClick={() => onOpenPicker('month')} />
        </div>

        <FieldLabel>Start Time</FieldLabel>
        <div className="sc-library-segment-row sc-library-time-row">
          <SegmentedBox label={padTime(selection.startHour)} active={pickerTarget === 'startHour'} onClick={() => onOpenPicker('startHour')} />
          <span>:</span>
          <SegmentedBox label={padTime(selection.startMinute)} active={pickerTarget === 'startMinute'} onClick={() => onOpenPicker('startMinute')} />
        </div>

        <FieldLabel>End Time</FieldLabel>
        <div className="sc-library-segment-row sc-library-time-row">
          <SegmentedBox label={padTime(selection.endHour)} active={pickerTarget === 'endHour'} onClick={() => onOpenPicker('endHour')} />
          <span>:</span>
          <SegmentedBox label={padTime(selection.endMinute)} active={pickerTarget === 'endMinute'} onClick={() => onOpenPicker('endMinute')} />
        </div>

        {pickerTarget && <WheelPicker target={pickerTarget} selection={selection} onChange={onChangeSelection} />}

        <label className="sc-library-description">
          <span>Add a description</span>
          <textarea value={selection.description} onChange={(event) => onChangeDescription(event.target.value)} rows={3} />
        </label>

        <div className={`sc-library-availability ${availability.isAvailable ? 'sc-library-availability--ok' : 'sc-library-availability--full'}`}>
          {availability.message}
        </div>

        <button className="sc-btn sc-btn--primary sc-library-confirm" disabled={!availability.isAvailable} onClick={onConfirm} type="button">
          Confirm Booking
        </button>
      </Card>
    </div>
  );
}

function QrSubPage({ booking, onBack }: { booking: LibraryBooking; onBack: () => void }) {
  const status = getCheckInStatus(booking);
  const actionLabel = booking.status === 'Active' ? 'Early Check-Out' : booking.status === 'Upcoming' ? 'Cancel Booking' : 'View History';

  return (
    <div className="sc-library-subpage sc-library-qr-page">
      <div className="sc-library-nav">
        <button className="sc-library-icon-btn" onClick={onBack} type="button" aria-label="Back">
          <Icon path="M15 18l-6-6 6-6" size={18} />
        </button>
        <div>
          <div className="sc-library-nav__title">Check-In QR</div>
          <div className="sc-library-nav__sub">{booking.libraryName}</div>
        </div>
      </div>

      <main className="sc-library-qr-page__body">
        <QrGraphic booking={booking} />
        <Card className="sc-library-qr-status">
          <Badge color={statusColors[booking.status]}>{booking.status}</Badge>
          <div className="sc-library-qr-status__title">{status.label}</div>
          <div className="sc-library-qr-status__sub">{status.detail}</div>
          <div className="sc-library-detail-grid">
            <div>
              <span>Date</span>
              <strong>{booking.dateLabel}</strong>
            </div>
            <div>
              <span>Time</span>
              <strong>
                {booking.startTime} - {booking.endTime}
              </strong>
            </div>
            <div>
              <span>Seat</span>
              <strong>{booking.seat}</strong>
            </div>
          </div>
        </Card>
      </main>

      <div className="sc-library-bottom-bar">
        <button className={booking.status === 'Completed' ? 'sc-btn' : 'sc-btn sc-btn--primary'} type="button">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [bookings, setBookings] = useState(LIBRARY_BOOKINGS_SEED);
  const [expandedId, setExpandedId] = useState<string | null>(LIBRARY_BOOKINGS_SEED[0]?.id ?? null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [selection, setSelection] = useState<BookingSelection>(initialSelection);

  const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId) ?? bookings[0];
  const availability = useMemo(() => getAvailability(selection), [selection]);

  function updateSelection(target: PickerTarget, value: number) {
    setSelection((current) => {
      const next = { ...current, [target]: value };
      if (target === 'month') {
        next.date = Math.min(next.date, getDaysInMonth(value));
      }
      return next;
    });
  }

  function confirmBooking() {
    if (!availability.isAvailable) return;
    const booking = createBooking(selection, bookings.length);
    setBookings((current) => [booking, ...current]);
    setExpandedId(booking.id);
    setSelectedBookingId(booking.id);
    setPickerTarget(null);
    setViewMode('feed');
  }

  if (viewMode === 'qr' && selectedBooking) {
    return <QrSubPage booking={selectedBooking} onBack={() => setViewMode('feed')} />;
  }

  if (viewMode === 'book') {
    return (
      <BookingWindow
        selection={selection}
        pickerTarget={pickerTarget}
        availability={availability}
        onBack={() => setViewMode('feed')}
        onConfirm={confirmBooking}
        onOpenPicker={(target) => setPickerTarget((current) => (current === target ? null : target))}
        onChangeSelection={updateSelection}
        onChangeDescription={(description) => setSelection((current) => ({ ...current, description }))}
      />
    );
  }

  return (
    <div className="sc-page sc-library-page">
      <div className="sc-library-page__header">
        <div>
          <div className="sc-library-page__eyebrow">Your Bookings</div>
          <h2>Library Bookings</h2>
        </div>
        <button className="sc-btn sc-btn--primary" onClick={() => setViewMode('book')} type="button">
          <Icon path={ICONS.library} size={16} color="#ffffff" />
          Book Slot
        </button>
      </div>

      <div className="sc-library-feed">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            expanded={expandedId === booking.id}
            onToggle={() => setExpandedId((current) => (current === booking.id ? null : booking.id))}
            onShowQr={() => {
              setSelectedBookingId(booking.id);
              setViewMode('qr');
            }}
          />
        ))}
      </div>
    </div>
  );
}
