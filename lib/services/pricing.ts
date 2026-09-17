import type { TeeTime } from '@prisma/client';

export type PricingRecommendation = {
  teeTimeId: string;
  currentGreenFeeCents: number;
  recommendedGreenFeeCents: number;
  adjustmentPercent: number;
  reason: string;
};

export function recommendTeeTimePrice(teeTime: TeeTime, occupancyRate: number): PricingRecommendation {
  const hour = teeTime.startTime.getHours();
  const day = teeTime.startTime.getDay();
  const isWeekend = day === 0 || day === 6;
  const isPrimeTime = hour >= 8 && hour <= 11;
  const isLateAfternoon = hour >= 15;

  let adjustmentPercent = 0;
  const reasons: string[] = [];

  if (isWeekend) {
    adjustmentPercent += 12;
    reasons.push('weekend demand');
  }
  if (isPrimeTime) {
    adjustmentPercent += 10;
    reasons.push('prime morning slot');
  }
  if (isLateAfternoon) {
    adjustmentPercent -= 8;
    reasons.push('late-day demand taper');
  }
  if (occupancyRate > 0.75) {
    adjustmentPercent += 8;
    reasons.push('high occupancy');
  }
  if (occupancyRate < 0.35) {
    adjustmentPercent -= 10;
    reasons.push('low occupancy');
  }

  const recommendedGreenFeeCents = Math.max(
    1500,
    Math.round((teeTime.greenFeeCents * (100 + adjustmentPercent)) / 100 / 100) * 100,
  );

  return {
    teeTimeId: teeTime.id,
    currentGreenFeeCents: teeTime.greenFeeCents,
    recommendedGreenFeeCents,
    adjustmentPercent,
    reason: reasons.length ? reasons.join(', ') : 'base pricing is aligned',
  };
}

export function priceWithFees(greenFeeCents: number, cartFeeCents: number, partySize: number) {
  return (greenFeeCents + cartFeeCents) * partySize;
}
