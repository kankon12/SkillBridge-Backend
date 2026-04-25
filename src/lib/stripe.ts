import Stripe from "stripe";
import config from "../config/index.js";

if (!config.stripe_secret_key) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(config.stripe_secret_key, {
  // @ts-ignore
  apiVersion: "2026-03-25.dahlia",
});