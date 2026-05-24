CREATE TABLE IF NOT EXISTS UserRelationship (
  id TEXT NOT NULL PRIMARY KEY,
  ownerUserId TEXT NOT NULL,
  targetUserId TEXT NOT NULL,
  type TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS UserRelationship_ownerUserId_targetUserId_key
ON UserRelationship(ownerUserId, targetUserId);

CREATE INDEX IF NOT EXISTS UserRelationship_ownerUserId_type_idx
ON UserRelationship(ownerUserId, type);

CREATE INDEX IF NOT EXISTS UserRelationship_targetUserId_idx
ON UserRelationship(targetUserId);
