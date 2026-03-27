import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import type { Env } from "./types";
import { authMiddleware } from "./middleware/auth";
import auth from "./routes/auth";
import sleep from "./routes/sleep";
import feed from "./routes/feed";
import nappy from "./routes/nappy";
import pump from "./routes/pump";
import dashboard from "./routes/dashboard";
import history from "./routes/history";
import dailyTasks from "./routes/dailyTasks";
import growth from "./routes/growth";

type AppBindings = {
  Bindings: Env;
};

const app = new Hono<AppBindings>();

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

app.use("/api/*", logger());

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Auth routes (no authentication required)
app.route("/api/auth", auth);

// Protected API routes
app.use("/api/*", authMiddleware);
app.route("/api/sleep", sleep);
app.route("/api/feed", feed);
app.route("/api/nappy", nappy);
app.route("/api/pump", pump);
app.route("/api/dashboard", dashboard);
app.route("/api/history", history);
app.route("/api/daily-tasks", dailyTasks);
app.route("/api/growth", growth);

// Fallback: serve static assets (SPA)
app.all("*", async (c) => {
  if (c.env.ASSETS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return c.env.ASSETS.fetch(c.req.raw as any) as unknown as Response;
  }
  return c.json({ error: "Not found" }, 404);
});

export default {
  fetch: app.fetch,
};
