CREATE TABLE "GroupMentor" (
    "groupId" INTEGER NOT NULL,
    "mentorId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMentor_pkey" PRIMARY KEY ("groupId", "mentorId")
);

ALTER TABLE "GroupMentor"
ADD CONSTRAINT "GroupMentor_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupMentor"
ADD CONSTRAINT "GroupMentor_mentorId_fkey"
FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
