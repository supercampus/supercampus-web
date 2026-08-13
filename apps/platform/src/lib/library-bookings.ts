export type LibraryBookingStatus = 'Active' | 'Upcoming' | 'Completed';

export interface LibraryBooking {
  id: string;
  libraryName: string;
  dateLabel: string;
  month: number;
  date: number;
  startTime: string;
  endTime: string;
  status: LibraryBookingStatus;
  seat: string;
  zone: string;
  rules: string[];
  capacityTotal: number;
  capacityBooked: number;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface BookingSelection {
  date: number;
  month: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  description: string;
}

export interface AvailabilityResult {
  available: number;
  total: number;
  booked: number;
  isAvailable: boolean;
  message: string;
}

export const MONTHS = [
  { value: 1, short: 'Jan', days: 31 },
  { value: 2, short: 'Feb', days: 28 },
  { value: 3, short: 'Mar', days: 31 },
  { value: 4, short: 'Apr', days: 30 },
  { value: 5, short: 'May', days: 31 },
  { value: 6, short: 'Jun', days: 30 },
  { value: 7, short: 'Jul', days: 31 },
  { value: 8, short: 'Aug', days: 31 },
  { value: 9, short: 'Sep', days: 30 },
  { value: 10, short: 'Oct', days: 31 },
  { value: 11, short: 'Nov', days: 30 },
  { value: 12, short: 'Dec', days: 31 },
];

export const LIBRARY_RULES = [
  'Keep your student ID ready for verification.',
  'Silent mode is required inside reading zones.',
  'Seat hold expires 15 minutes after the slot starts.',
];

export const LIBRARY_BOOKINGS_SEED: LibraryBooking[] = [
  {
    id: 'LIB-2026-0812-A',
    libraryName: 'Central Library - Reading Hall',
    dateLabel: '12 Aug',
    month: 8,
    date: 12,
    startTime: '10:00',
    endTime: '12:00',
    status: 'Active',
    seat: 'A-18',
    zone: 'Reading Hall',
    rules: LIBRARY_RULES,
    capacityTotal: 40,
    capacityBooked: 28,
    checkedInAt: '10:04',
  },
  {
    id: 'LIB-2026-0814-D',
    libraryName: 'Digital Library - Research Zone',
    dateLabel: '14 Aug',
    month: 8,
    date: 14,
    startTime: '14:00',
    endTime: '16:00',
    status: 'Upcoming',
    seat: 'D-07',
    zone: 'Research Zone',
    rules: LIBRARY_RULES,
    capacityTotal: 24,
    capacityBooked: 17,
  },
  {
    id: 'LIB-2026-0808-B',
    libraryName: 'Central Library - Quiet Zone',
    dateLabel: '08 Aug',
    month: 8,
    date: 8,
    startTime: '09:00',
    endTime: '10:30',
    status: 'Completed',
    seat: 'Q-12',
    zone: 'Quiet Zone',
    rules: LIBRARY_RULES,
    capacityTotal: 30,
    capacityBooked: 30,
    checkedInAt: '09:02',
    checkedOutAt: '10:22',
  },
];

const bookedBySlot: Record<string, number> = {
  '8-13-10:00-12:00': 28,
  '8-13-16:00-18:00': 40,
  '8-14-14:00-16:00': 17,
  '8-15-11:00-13:00': 39,
};

export function getMonthLabel(month: number) {
  return MONTHS.find((item) => item.value === month)?.short ?? 'Aug';
}

export function getDaysInMonth(month: number) {
  return MONTHS.find((item) => item.value === month)?.days ?? 31;
}

export function padTime(value: number) {
  return String(value).padStart(2, '0');
}

export function toTime(hour: number, minute: number) {
  return `${padTime(hour)}:${padTime(minute)}`;
}

export function toMinutes(hour: number, minute: number) {
  return hour * 60 + minute;
}

export function getAvailability(selection: BookingSelection): AvailabilityResult {
  const start = toMinutes(selection.startHour, selection.startMinute);
  const end = toMinutes(selection.endHour, selection.endMinute);
  const total = 40;

  if (end <= start) {
    return {
      available: 0,
      total,
      booked: total,
      isAvailable: false,
      message: 'End time must be after start time.',
    };
  }

  const duration = end - start;
  if (duration < 30) {
    return {
      available: 0,
      total,
      booked: total,
      isAvailable: false,
      message: 'Minimum booking duration is 30 minutes.',
    };
  }

  const key = `${selection.month}-${selection.date}-${toTime(selection.startHour, selection.startMinute)}-${toTime(selection.endHour, selection.endMinute)}`;
  const booked = bookedBySlot[key] ?? Math.min(total, 14 + ((selection.date + selection.startHour + selection.endHour) % 20));
  const available = Math.max(0, total - booked);

  return {
    available,
    total,
    booked,
    isAvailable: available > 0,
    message: available > 0 ? `${available} slots available` : 'Slot Full - Please select a different time or try later.',
  };
}

export function createBooking(selection: BookingSelection, existingCount: number): LibraryBooking {
  const availability = getAvailability(selection);
  return {
    id: `LIB-2026-${padTime(selection.month)}${padTime(selection.date)}-${existingCount + 1}`,
    libraryName: 'Central Library - Reading Hall',
    dateLabel: `${padTime(selection.date)} ${getMonthLabel(selection.month)}`,
    month: selection.month,
    date: selection.date,
    startTime: toTime(selection.startHour, selection.startMinute),
    endTime: toTime(selection.endHour, selection.endMinute),
    status: 'Upcoming',
    seat: `A-${padTime(availability.booked + 1)}`,
    zone: 'Reading Hall',
    rules: LIBRARY_RULES,
    capacityTotal: availability.total,
    capacityBooked: availability.booked + 1,
  };
}

export function getCheckInStatus(booking: LibraryBooking) {
  if (booking.status === 'Active') {
    return {
      label: 'Checked in',
      detail: booking.checkedInAt ? `Checked in at ${booking.checkedInAt}` : 'Awaiting scanner confirmation',
    };
  }

  if (booking.status === 'Upcoming') {
    return {
      label: 'QR ready',
      detail: 'Scan at the library desk during your booking window.',
    };
  }

  return {
    label: 'Completed',
    detail: booking.checkedOutAt ? `Checked out at ${booking.checkedOutAt}` : 'Session closed',
  };
}

