// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Add global prisma variable to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with proper error handling
export const prisma = globalForPrisma.prisma ?? (() => {
  try {
    return new PrismaClient({
      log: ['query', 'error', 'warn'],
    })
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    throw error
  }
})()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma