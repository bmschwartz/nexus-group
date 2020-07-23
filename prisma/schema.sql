CREATE TYPE MEMBERSHIP_STATUS AS ENUM('PENDING', 'APPROVED', 'DENIED');
CREATE TYPE MEMBERSHIP_ROLE AS ENUM('MEMBER', 'ADMIN', 'TRADER');

CREATE TABLE "public"."Group" (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "public"."GroupMembership" (
  id SERIAL PRIMARY KEY NOT NULL,
  "memberId" INTEGER NOT NULL,
  "groupId" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT FALSE,
  "role" MEMBERSHIP_ROLE NOT NULL DEFAULT 'MEMBER',
  "status" MEMBERSHIP_STATUS NOT NULL DEFAULT 'PENDING',
  FOREIGN KEY ("groupId") REFERENCES "public"."Group"(id),
  UNIQUE("memberId", "groupId")
);