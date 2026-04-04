import express from "express";
import cors from "cors";
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


app.all("/api/auth/*path", async (req: any, res: any) => {
  const { toNodeHandler } = await import("better-auth/node");
  const { getAuth } = await import("./lib/auth");
  const auth = await getAuth();
  return toNodeHandler(auth)(req, res);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;