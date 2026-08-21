-- CreateTable
CREATE TABLE "agent_action_log" (
    "id" SERIAL NOT NULL,
    "proctor_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "student_usn" TEXT,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "agent_action_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_alerts" (
    "id" SERIAL NOT NULL,
    "student_usn" TEXT NOT NULL,
    "proctor_id" TEXT NOT NULL,
    "risk_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_reminders" (
    "id" SERIAL NOT NULL,
    "proctor_id" TEXT NOT NULL,
    "student_usn" TEXT,
    "title" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_reminders_pkey" PRIMARY KEY ("id")
);
