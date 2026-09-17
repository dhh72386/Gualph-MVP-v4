ALTER TABLE "User"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "TeeTime"
ADD CONSTRAINT "TeeTime_playersAllowed_check" CHECK ("playersAllowed" > 0),
ADD CONSTRAINT "TeeTime_greenFeeCents_check" CHECK ("greenFeeCents" >= 0),
ADD CONSTRAINT "TeeTime_cartFeeCents_check" CHECK ("cartFeeCents" >= 0);

ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_partySize_check" CHECK ("partySize" > 0),
ADD CONSTRAINT "Reservation_totalCents_check" CHECK ("totalCents" >= 0);

ALTER TABLE "OperatingHour"
ADD CONSTRAINT "OperatingHour_dayOfWeek_check" CHECK ("dayOfWeek" BETWEEN 0 AND 6);

ALTER TABLE "Player"
ADD CONSTRAINT "Player_loyaltyPoints_check" CHECK ("loyaltyPoints" >= 0);
