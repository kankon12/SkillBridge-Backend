import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),
      emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  }, user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "STUDENT",
        input: true, // allow setting during registration
      },
      isBanned: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],

  advanced: {
    cookiePrefix: "skillbridge",
  },
});