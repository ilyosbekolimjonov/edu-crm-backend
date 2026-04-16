ALTER TYPE "HomeworkSubStatus" RENAME TO "HomeworkSubStatus_old";

CREATE TYPE "HomeworkSubStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

ALTER TABLE "HomeworkSubmission"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "HomeworkSubmission"
  ALTER COLUMN "status" TYPE "HomeworkSubStatus"
  USING (
    CASE
      WHEN "status"::text = 'APPROVED' THEN 'ACCEPTED'
      ELSE "status"::text
    END
  )::"HomeworkSubStatus";

ALTER TABLE "HomeworkSubmission"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "HomeworkSubStatus_old";

ALTER TABLE "HomeworkSubmission"
  ADD COLUMN "score" INTEGER,
  ADD COLUMN "comment" TEXT;
