-- AlterTable
ALTER TABLE
  "item"
ADD
  COLUMN "category" TEXT;

UPDATE
  "item"
SET
  "category" = 'TEST';