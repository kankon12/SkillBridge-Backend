import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { stripeWebhook } from "./modules/payments/payments.controller.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://skillbridge-frontend-rho-nine.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// better-auth handler
app.all("/api/auth/*path", toNodeHandler(auth));

// ⚠️ Stripe webhook — express.json() এর আগে রাখতে হবে, raw body লাগে
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// বাকি সব routes-এর জন্য normal JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// All API routes
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;