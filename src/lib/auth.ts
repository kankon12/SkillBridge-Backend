import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

export const auth = betterAuth({
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
      banReason: {
        type: "string",
        defaultValue: null,
        input: false,
      },
    },
  },
  trustedOrigins: [
    process.env.FRONTEND_URL || "https://skillbridge-frontend-rho-nine.vercel.app",
    "http://localhost:3000",
  ],
  advanced: {
    cookiePrefix: "skillbridge",
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      partitioned: process.env.NODE_ENV === "production",
    },
  },
});

export const getAuth = async () => auth;
export type Auth = typeof auth;

