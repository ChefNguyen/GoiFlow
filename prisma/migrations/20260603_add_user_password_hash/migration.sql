-- AlterTable: Add passwordHash column to User table for credentials-based authentication
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
