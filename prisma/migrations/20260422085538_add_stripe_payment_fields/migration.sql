-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeSessionId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
