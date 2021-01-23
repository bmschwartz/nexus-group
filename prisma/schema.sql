DROP DATABASE IF EXISTS "nexus_groups";
CREATE DATABASE "nexus_groups";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE "MembershipStatus" AS ENUM('PENDING', 'APPROVED', 'DENIED');
CREATE TYPE "MembershipRole" AS ENUM('MEMBER', 'ADMIN', 'TRADER');
CREATE TYPE "PayoutCurrency" AS ENUM('BTC', 'ETH', 'LTC');

CREATE TABLE "public"."Group" (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  telegram VARCHAR(255),
  discord VARCHAR(255),
  email VARCHAR(255),
  "payoutAddress" VARCHAR(255),
  "payoutCurrency" "PayoutCurrency" NOT NULL DEFAULT 'BTC',
  "payInPlatform" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE("name")
);

CREATE TABLE "public"."GroupMembership" (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "memberId" uuid NOT NULL,
  "groupId" uuid NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT FALSE,
  "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
  "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  FOREIGN KEY ("groupId") REFERENCES "public"."Group"(id),
  UNIQUE("memberId", "groupId")
);

CREATE TABLE "public"."GroupMembershipOption" (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "groupId" uuid NOT NULL,
  "membershipFee" NUMERIC NOT NULL,
  "membershipLength" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  FOREIGN KEY ("groupId") REFERENCES "public"."Group"(id)
);