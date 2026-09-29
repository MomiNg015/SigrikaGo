ALTER TABLE "User" ADD COLUMN "homeOnboardingStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "User" ADD COLUMN "homeOnboardingFinishedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "onboardingExitedAt" DATETIME;
-- Legacy auto-shown accounts may have skipped the old story without completing it.
UPDATE "User" SET "onboardingExitedAt" = "onboardingAutoShownAt" WHERE "onboardingAutoShownAt" IS NOT NULL;
