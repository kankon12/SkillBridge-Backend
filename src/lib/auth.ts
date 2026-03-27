// import { betterAuth } from "better-auth";
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { prisma } from "./prisma";

// export const auth = betterAuth({
//   database: PrismaAdapter(prisma),

//   emailAndPassword: {
//     enabled: true,
//     minPasswordLength: 8,
//   },

//   user: {
//     additionalFields: {
//       role: {
//         type: "string",
//         defaultValue: "STUDENT",
//         input: true,
//       },
//       isBanned: {
//         type: "boolean",
//         defaultValue: false,
//         input: false,
//       },
//     },
//   },

//   trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],

//   advanced: {
//     cookiePrefix: "skillbridge",
//   },
// });
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

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
        input: true, // allow setting during registration
      },
      isBanned: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },

  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:5000"],

  advanced: {
    cookiePrefix: "skillbridge",
  },
});

export type Auth = typeof auth;