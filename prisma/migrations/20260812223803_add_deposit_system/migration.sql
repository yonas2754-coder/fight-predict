-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'DEPOSIT';

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deposit_userId_idx" ON "Deposit"("userId");

-- CreateIndex
CREATE INDEX "Deposit_status_idx" ON "Deposit"("status");

-- CreateIndex
CREATE INDEX "Deposit_transactionNumber_idx" ON "Deposit"("transactionNumber");

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
