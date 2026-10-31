/*
  Warnings:

  - You are about to drop the column `provided` on the `Submission` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChallengeFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challengeId" TEXT NOT NULL,
    "assetId" TEXT,
    CONSTRAINT "ChallengeFile_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChallengeFile_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FileAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ChallengeFile" ("challengeId", "createdAt", "id", "name", "path", "sizeBytes") SELECT "challengeId", "createdAt", "id", "name", "path", "sizeBytes" FROM "ChallengeFile";
DROP TABLE "ChallengeFile";
ALTER TABLE "new_ChallengeFile" RENAME TO "ChallengeFile";
CREATE INDEX "ChallengeFile_challengeId_idx" ON "ChallengeFile"("challengeId");
CREATE INDEX "ChallengeFile_assetId_idx" ON "ChallengeFile"("assetId");
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "teamMaxSize" INTEGER NOT NULL DEFAULT 5,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "scoringMode" TEXT NOT NULL DEFAULT 'STATIC',
    "scoringMinimumPoints" INTEGER NOT NULL DEFAULT 100,
    "scoringDecayThreshold" INTEGER NOT NULL DEFAULT 40,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Event" ("createdAt", "description", "endsAt", "id", "name", "published", "slug", "startsAt", "teamMaxSize", "updatedAt") SELECT "createdAt", "description", "endsAt", "id", "name", "published", "slug", "startsAt", "teamMaxSize", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE TABLE "new_Flag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT,
    "salt" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "algo" TEXT NOT NULL DEFAULT 'sha256',
    "points" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challengeId" TEXT NOT NULL,
    CONSTRAINT "Flag_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Flag" ("challengeId", "createdAt", "hash", "id", "label", "order", "points", "salt") SELECT "challengeId", "createdAt", "hash", "id", "label", "order", "points", "salt" FROM "Flag";
DROP TABLE "Flag";
ALTER TABLE "new_Flag" RENAME TO "Flag";
CREATE INDEX "Flag_challengeId_idx" ON "Flag"("challengeId");
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providedSalt" TEXT,
    "providedHash" TEXT,
    "providedLength" INTEGER,
    "correct" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "challengeId" TEXT NOT NULL,
    "flagId" TEXT,
    CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "Flag" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("challengeId", "correct", "createdAt", "flagId", "id", "teamId", "userId") SELECT "challengeId", "correct", "createdAt", "flagId", "id", "teamId", "userId" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");
CREATE INDEX "Submission_teamId_idx" ON "Submission"("teamId");
CREATE INDEX "Submission_challengeId_idx" ON "Submission"("challengeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_storedName_key" ON "FileAsset"("storedName");
