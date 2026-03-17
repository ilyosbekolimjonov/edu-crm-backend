CREATE TABLE "GroupAttendance" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "lessonDate" TIMESTAMP(3) NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupAttendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupAttendance_groupId_userId_lessonDate_key"
ON "GroupAttendance"("groupId", "userId", "lessonDate");

ALTER TABLE "GroupAttendance"
ADD CONSTRAINT "GroupAttendance_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupAttendance"
ADD CONSTRAINT "GroupAttendance_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
