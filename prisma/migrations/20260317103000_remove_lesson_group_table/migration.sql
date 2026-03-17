-- Re-link lesson-related records directly to Group and remove obsolete LessonGroup table.
ALTER TABLE "LastActivity" DROP CONSTRAINT IF EXISTS "LastActivity_groupId_fkey";
ALTER TABLE "Lesson" DROP CONSTRAINT IF EXISTS "Lesson_groupId_fkey";
ALTER TABLE "Exam" DROP CONSTRAINT IF EXISTS "Exam_lessonGroupId_fkey";
ALTER TABLE "ExamResult" DROP CONSTRAINT IF EXISTS "ExamResult_lessonGroupId_fkey";

DROP TABLE IF EXISTS "LessonGroup";

ALTER TABLE "LastActivity"
ADD CONSTRAINT "LastActivity_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lesson"
ADD CONSTRAINT "Lesson_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Exam"
ADD CONSTRAINT "Exam_lessonGroupId_fkey"
FOREIGN KEY ("lessonGroupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamResult"
ADD CONSTRAINT "ExamResult_lessonGroupId_fkey"
FOREIGN KEY ("lessonGroupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
