import { PrismaClient } from '@prisma/client/edge';

// Try to import the accelerate extension, but don't fail if it's not available
// This prevents TypeScript errors during compilation
let withAccelerate: Function | undefined;
try {
  withAccelerate = require('@prisma/extension-accelerate').withAccelerate;
} catch (e) {
  console.warn('Accelerate extension not available, edge optimizations disabled');
  withAccelerate = undefined;
}

// Create a new PrismaClient instance with the edge adapter
const prismaClientSingleton = () => {
  const prisma = new PrismaClient();
  // Only extend with accelerate if the extension is available
  return withAccelerate ? prisma.$extends(withAccelerate()) : prisma;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Use a global singleton to avoid multiple instances in development
export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
