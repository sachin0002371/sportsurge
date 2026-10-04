import { PrismaClient } from '@prisma/client'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.warn('⚠️ [db.ts] DATABASE_URL environment variable is missing at runtime.')
  }

  const adapter = new PrismaNeonHttp(connectionString || '')
  const client = new PrismaClient({ adapter, log: ['error'] })

  globalForPrisma.prisma = client
  return client
}

// Export a lazy Proxy so PrismaClient is never instantiated at module load time.
// This prevents top-level module crashes during Cloudflare Worker isolate initialization.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrismaClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})