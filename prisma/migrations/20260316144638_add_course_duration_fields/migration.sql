-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "durationMonths" INTEGER NOT NULL DEFAULT 1;
