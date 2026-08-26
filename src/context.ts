import { PrismaClient } from '@prisma/client';
import { prisma } from './lib/prisma.js';

export interface GraphQLContext {
  prisma: PrismaClient;
}

export async function createContext(): Promise<GraphQLContext> {
  return {
    prisma,
  };
}