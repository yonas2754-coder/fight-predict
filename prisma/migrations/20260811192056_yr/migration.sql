-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FightStatus" AS ENUM ('UPCOMING', 'LIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INITIAL_BALANCE', 'PREDICTION', 'WIN', 'REFUND');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "balance" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fighterAName" TEXT NOT NULL,
    "fighterBName" TEXT NOT NULL,
    "fighterAProbability" INTEGER NOT NULL,
    "fighterBProbability" INTEGER NOT NULL,
    "status" "FightStatus" NOT NULL DEFAULT 'UPCOMING',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "selectedFighter" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PredictionStatus" NOT NULL DEFAULT 'PENDING',
    "potentialWin" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "Fight_status_idx" ON "Fight"("status");

-- CreateIndex
CREATE INDEX "Fight_scheduledAt_idx" ON "Fight"("scheduledAt");

-- CreateIndex
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");

-- CreateIndex
CREATE INDEX "Prediction_fightId_idx" ON "Prediction"("fightId");

-- CreateIndex
CREATE INDEX "Prediction_status_idx" ON "Prediction"("status");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
