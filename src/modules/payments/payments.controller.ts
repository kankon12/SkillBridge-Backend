import { Request, Response } from "express";
import { stripe } from "../../lib/stripe.js";
import { prisma } from "../../lib/prisma.js";
import config from "../../config/index.js";
import Stripe from "stripe";

// POST /api/payments/webhook
// ⚠️  এই route-এ raw body দিতে হবে — JSON parser কাজ করবে না
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({ message: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;

  try {
    // Stripe signature verify করো raw body দিয়ে
    event = stripe.webhooks.constructEvent(
      req.body,  // raw Buffer — app.ts-এ express.raw() দিতে হবে
      sig,
      config.stripe_webhook_secret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      // ✅ Payment সফল হলে booking CONFIRMED করো
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status === "paid") {
          const bookingId = session.metadata?.bookingId;

          if (!bookingId) {
            console.error("No bookingId in Stripe session metadata");
            break;
          }

          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
          });

          if (!booking) {
            console.error(`Booking not found for id: ${bookingId}`);
            break;
          }

          // Booking CONFIRMED করো + isPaid = true
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: "CONFIRMED",
              isPaid: true,
            },
          });

          console.log(`✅ Booking ${bookingId} confirmed after successful payment`);
        }
        break;
      }

      // ❌ Payment fail হলে booking CANCELLED করো
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: "CANCELLED",
              cancelReason: "Payment session expired",
            },
          });

          console.log(`❌ Booking ${bookingId} cancelled — payment session expired`);
        }
        break;
      }

      default:
        // অন্য events ignore করো
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Error processing webhook event:", err);
    // Stripe-কে 200 দাও নাহলে বারবার retry করবে
  }

  // Stripe সবসময় 200 চায়
  return res.status(200).json({ received: true });
};