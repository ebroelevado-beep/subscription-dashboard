-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "ClientSubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled');

-- CreateTable
CREATE TABLE "platforms" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "platform_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "max_seats" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "active_until" DATE NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_subscriptions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "custom_price" DECIMAL(10,2) NOT NULL,
    "active_until" DATE NOT NULL,
    "joined_at" DATE NOT NULL,
    "left_at" DATE,
    "status" "ClientSubscriptionStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "client_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renewal_logs" (
    "id" TEXT NOT NULL,
    "client_subscription_id" TEXT NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "expected_amount" DECIMAL(10,2) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "paid_on" DATE NOT NULL,
    "due_on" DATE NOT NULL,
    "months_renewed" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "renewal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_renewals" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "paid_on" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platforms_name_key" ON "platforms"("name");

-- CreateIndex
CREATE INDEX "client_subscriptions_client_id_idx" ON "client_subscriptions"("client_id");

-- CreateIndex
CREATE INDEX "client_subscriptions_subscription_id_idx" ON "client_subscriptions"("subscription_id");

-- CreateIndex
CREATE INDEX "client_subscriptions_status_idx" ON "client_subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "client_subscriptions_client_id_subscription_id_key" ON "client_subscriptions"("client_id", "subscription_id");

-- CreateIndex
CREATE INDEX "renewal_logs_client_subscription_id_idx" ON "renewal_logs"("client_subscription_id");

-- CreateIndex
CREATE INDEX "renewal_logs_paid_on_idx" ON "renewal_logs"("paid_on");

-- CreateIndex
CREATE INDEX "platform_renewals_subscription_id_idx" ON "platform_renewals"("subscription_id");

-- CreateIndex
CREATE INDEX "platform_renewals_paid_on_idx" ON "platform_renewals"("paid_on");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_subscriptions" ADD CONSTRAINT "client_subscriptions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_subscriptions" ADD CONSTRAINT "client_subscriptions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewal_logs" ADD CONSTRAINT "renewal_logs_client_subscription_id_fkey" FOREIGN KEY ("client_subscription_id") REFERENCES "client_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_renewals" ADD CONSTRAINT "platform_renewals_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
