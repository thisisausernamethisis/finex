import { PrismaClient } from '@prisma/client'
import { Container, TOKEN_PRISMA } from './container'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-prisma-client-js

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma || new PrismaClient()

// Register the PrismaClient instance in the Container
Container.set(TOKEN_PRISMA, prisma)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
