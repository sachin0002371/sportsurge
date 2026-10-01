import { PrismaClient } from '@prisma/client'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

const DEFAULT_DB_URL = "postgresql://neondb_owner:npg_b0dgB9izZeHx@ep-billowing-paper-asl1j3hb-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || DEFAULT_DB_URL
  const adapter = new PrismaNeonHttp(connectionString)
  return new PrismaClient({ adapter, log: ['error'] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db