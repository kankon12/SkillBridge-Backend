import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { errorHandler, notFound } from "./middleware/error.middleware";

// Route modules
import authRoutes from "./modules/auth/auth.routes";
import tutorRoutes from "./modules/tutors/tutors.routes";
import bookingRoutes from "./modules/bookings/bookings.routes";
import reviewRoutes from "./modules/reviews/reviews.routes";
import categoryRoutes from "./modules/categories/categories.routes";
import adminRoutes from "./modules/admin/admin.routes";

const app = express();


  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.all("/api/auth/*", toNodeHandler(auth));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes 
app.use("/api/auth", authRoutes);           // GET /api/auth/me, PATCH /api/auth/profile
app.use("/api/tutors", tutorRoutes);        // GET /api/tutors, GET /api/tutors/:id
app.use("/api/tutor", tutorRoutes);         // PUT /api/tutor/profile, PUT /api/tutor/availability
app.use("/api/bookings", bookingRoutes);    // POST/GET /api/bookings
app.use("/api/reviews", reviewRoutes);      // POST /api/reviews
app.use("/api/categories", categoryRoutes); // GET /api/categories
app.use("/api/admin", adminRoutes);         // All admin routes

// ─── Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;