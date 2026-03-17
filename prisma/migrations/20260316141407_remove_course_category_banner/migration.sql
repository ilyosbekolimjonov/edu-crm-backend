/*
  Warnings:

  - You are about to drop the column `banner` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the `CourseCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_categoryId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "banner",
DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "CourseCategory";
