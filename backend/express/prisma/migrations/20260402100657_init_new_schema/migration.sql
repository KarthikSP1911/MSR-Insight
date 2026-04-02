-- CreateTable
CREATE TABLE "students" (
    "usn" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "current_year" INTEGER NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("usn")
);

-- CreateTable
CREATE TABLE "proctors" (
    "proctor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "proctors_pkey" PRIMARY KEY ("proctor_id")
);

-- CreateTable
CREATE TABLE "parents" (
    "usn" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("usn","relation")
);

-- CreateTable
CREATE TABLE "proctor_student_map" (
    "id" SERIAL NOT NULL,
    "proctor_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,

    CONSTRAINT "proctor_student_map_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proctor_student_map_student_id_academic_year_key" ON "proctor_student_map"("student_id", "academic_year");

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_usn_fkey" FOREIGN KEY ("usn") REFERENCES "students"("usn") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctor_student_map" ADD CONSTRAINT "proctor_student_map_proctor_id_fkey" FOREIGN KEY ("proctor_id") REFERENCES "proctors"("proctor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctor_student_map" ADD CONSTRAINT "proctor_student_map_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("usn") ON DELETE RESTRICT ON UPDATE CASCADE;
