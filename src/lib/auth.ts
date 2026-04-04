import { prisma } from "./prisma";

let authInstance: any = null;

export async function getAuth() {
  if (authInstance) return authInstance;
  
  const { betterAuth } = await import("better-auth");
  const { prismaAdapter } = await import("better-auth/adapters/prisma");

  authInstance = betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "STUDENT",
          input: true,
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

  return authInstance;
}

export type Auth = Awaited<ReturnType<typeof getAuth>>;