import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

import routes from "./routes";
import { errorHandler, notFound } from "./middlewares/error.middleware";


const app = express();


app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.all("/api/auth/{*path}", toNodeHandler(auth));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  Health Check 
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API Routes (CLEAN)
app.use("/api", routes);

//  Error Handling 
app.use(notFound);
app.use(errorHandler);

export default app;