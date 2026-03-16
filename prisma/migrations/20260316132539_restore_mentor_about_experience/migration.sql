-- AlterTable
ALTER TABLE "Mentor" ADD COLUMN     "about" TEXT,
ADD COLUMN     "experience" INTEGER NOT NULL DEFAULT 0;
