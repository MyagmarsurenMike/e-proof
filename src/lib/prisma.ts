import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Add connection error handling
prisma.$on('error' as never, (e: any) => {
  console.error('Prisma error:', e)
})

// Ensure clean shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  
  // Add graceful shutdown
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
  })
  
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
  })
}