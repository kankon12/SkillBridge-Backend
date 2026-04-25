import { Router } from "express";
import { stripeWebhook } from "./payments.controller.js";

const router = Router();


router.post("/webhook", stripeWebhook);

export const paymentrouter = router ;