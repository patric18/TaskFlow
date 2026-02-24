-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboarding_completed_at" TIMESTAMP(3);

-- Existing users skip onboarding
UPDATE "users" SET "onboarding_completed_at" = NOW() WHERE "onboarding_completed_at" IS NULL;
