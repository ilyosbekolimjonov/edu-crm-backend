/*
  Warnings:

  - You are about to drop the column `about` on the `Mentor` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `Mentor` table. All the data in the column will be lost.
  - You are about to drop the column `facebook` on the `Mentor` table. All the data in the column will be lost.
  - You are about to drop the column `github` on the `Mentor` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `Mentor` table. All the data in the column will be lost.
  - You are about to drop the column `job` on the `Mentor` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Mentor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mentor" DROP COLUMN "about",
DROP COLUMN "experience",
DROP COLUMN "facebook",
DROP COLUMN "github",
DROP COLUMN "instagram",
DROP COLUMN "job",
DROP COLUMN "website";
