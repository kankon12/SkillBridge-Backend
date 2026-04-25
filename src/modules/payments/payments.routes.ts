import { Router } from "express";
import { stripeWebhook } from "./payments.controller.js";

const router = Router();

// ⚠️ এই route-এ express.raw() middleware দিতে হবে
// সেটা app.ts-এ করা হয়েছে — এখানে শুধু handler
router.post("/webhook", stripeWebhook);

export const paymentrouter = router ;