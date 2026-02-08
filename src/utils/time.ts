// Time formatting utilities

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatDurationShort(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatTime(timestamp: number, format: '12h' | '24h' = '12h'): string {
  const date = new Date(timestamp);
  
  if (format === '24h') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTimeRange(start: number, end: number, format: '12h' | '24h' = '12h'): string {
  return `${formatTime(start, format)} - ${formatTime(end, format)}`;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'Today';
  }
  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getEndOfDay(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getDaysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get wake window recommendation based on age in months
export function getRecommendedWakeWindow(ageInMonths: number): { min: number; max: number } {
  // Wake windows in minutes based on typical recommendations
  if (ageInMonths < 1) return { min: 35, max: 60 };
  if (ageInMonths < 2) return { min: 45, max: 75 };
  if (ageInMonths < 3) return { min: 60, max: 90 };
  if (ageInMonths < 4) return { min: 75, max: 120 };
  if (ageInMonths < 5) return { min: 90, max: 150 };
  if (ageInMonths < 6) return { min: 120, max: 180 };
  if (ageInMonths < 7) return { min: 120, max: 180 };
  if (ageInMonths < 8) return { min: 150, max: 210 };
  if (ageInMonths < 9) return { min: 150, max: 210 };
  if (ageInMonths < 10) return { min: 180, max: 240 };
  if (ageInMonths < 12) return { min: 180, max: 270 };
  if (ageInMonths < 15) return { min: 210, max: 300 };
  if (ageInMonths < 18) return { min: 270, max: 360 };
  return { min: 300, max: 420 }; // 5-7 hours for older toddlers
}

// Calculate age in months from birthdate
export function getAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  
  let months = (now.getFullYear() - birth.getFullYear()) * 12;
  months += now.getMonth() - birth.getMonth();
  
  // Adjust if the day hasn't occurred yet this month
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  
  return Math.max(0, months);
}

// Determine if sleep should be classified as nap or night based on time
export function classifySleepType(startTime: number): 'nap' | 'night' {
  const hour = new Date(startTime).getHours();
  // Night sleep typically starts between 6 PM and 6 AM
  if (hour >= 18 || hour < 6) {
    return 'night';
  }
  return 'nap';
}
