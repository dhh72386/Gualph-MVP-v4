import type { TeeTime } from '@prisma/client';

export type TeeSheetSuggestion = {
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  detail: string;
};

export function generateTeeSheetSuggestions(teeTimes: TeeTime[]): TeeSheetSuggestion[] {
  const suggestions: TeeSheetSuggestion[] = [];
  const sorted = [...teeTimes].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const reserved = sorted.filter((time) => time.status === 'RESERVED').length;
  const occupancyRate = sorted.length ? reserved / sorted.length : 0;

  if (occupancyRate < 0.45) {
    suggestions.push({
      title: 'Compress low-demand windows',
      impact: 'HIGH',
      detail: 'Occupancy is below target. Consider widening public availability around booked clusters and discounting isolated open slots.',
    });
  }

  const primeOpen = sorted.filter((time) => {
    const hour = time.startTime.getHours();
    return time.status === 'AVAILABLE' && hour >= 8 && hour <= 11;
  });

  if (primeOpen.length > 4) {
    suggestions.push({
      title: 'Reprice prime morning inventory',
      impact: 'MEDIUM',
      detail: `${primeOpen.length} prime morning tee times remain open. Review dynamic pricing before releasing more discounts.`,
    });
  }

  const gaps = sorted.filter((time, index) => {
    const previous = sorted[index - 1];
    const next = sorted[index + 1];
    return time.status === 'AVAILABLE' && previous?.status === 'RESERVED' && next?.status === 'RESERVED';
  });

  if (gaps.length) {
    suggestions.push({
      title: 'Fill single-slot gaps',
      impact: 'MEDIUM',
      detail: `${gaps.length} open slots are surrounded by booked times. Promote these to waitlist and loyalty players first.`,
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      title: 'Tee sheet is balanced',
      impact: 'LOW',
      detail: 'Inventory distribution and occupancy look healthy for the current schedule.',
    });
  }

  return suggestions;
}
