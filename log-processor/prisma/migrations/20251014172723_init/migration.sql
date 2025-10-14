-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "functions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "functionId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "requestHeaders" JSONB,
    "requestUserAgent" TEXT,
    "requestUrl" TEXT,
    "requestParams" JSONB,
    "requestBody" JSONB,
    "responseCode" INTEGER,
    "responseSuccess" BOOLEAN,
    "responseMessage" TEXT,
    "responseData" JSONB,
    "consoleLog" TEXT,
    "additionalData" JSONB,
    "latency" INTEGER,
    "createdById" TEXT,
    "createdByFullname" TEXT,
    "createdByEmplCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_key" ON "projects"("name");

-- CreateIndex
CREATE INDEX "projects_name_idx" ON "projects"("name");

-- CreateIndex
CREATE INDEX "functions_projectId_idx" ON "functions"("projectId");

-- CreateIndex
CREATE INDEX "functions_name_idx" ON "functions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "functions_projectId_name_key" ON "functions"("projectId", "name");

-- CreateIndex
CREATE INDEX "logs_projectId_idx" ON "logs"("projectId");

-- CreateIndex
CREATE INDEX "logs_functionId_idx" ON "logs"("functionId");

-- CreateIndex
CREATE INDEX "logs_type_idx" ON "logs"("type");

-- CreateIndex
CREATE INDEX "logs_method_idx" ON "logs"("method");

-- CreateIndex
CREATE INDEX "logs_createdAt_idx" ON "logs"("createdAt");

-- CreateIndex
CREATE INDEX "logs_projectId_functionId_idx" ON "logs"("projectId", "functionId");

-- CreateIndex
CREATE INDEX "logs_projectId_type_idx" ON "logs"("projectId", "type");

-- CreateIndex
CREATE INDEX "logs_projectId_createdAt_idx" ON "logs"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "logs_functionId_type_idx" ON "logs"("functionId", "type");

-- CreateIndex
CREATE INDEX "logs_responseCode_idx" ON "logs"("responseCode");

-- CreateIndex
CREATE INDEX "logs_createdById_idx" ON "logs"("createdById");

-- AddForeignKey
ALTER TABLE "functions" ADD CONSTRAINT "functions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
