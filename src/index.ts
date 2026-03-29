import express from "express";
import path from "path";
import { fileURLToPath } from "node:url";

import homeRoutes from "./routes/home.js";
import testRoutes from "./routes/test.js";
import authRoutes from "./routes/auth.js";

import logging from "./middleware/logging.js";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import db from "./db/connection.js";
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3000;

const PgSession = connectPgSimple(session);

// --- Middleware ---
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(express.static(path.join(__dirname, "../public"))); // serve static files
app.use(
  session({
    store: new PgSession({ pgPromise: db }),
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(logging);
app.use("/", homeRoutes);
app.use("/test", testRoutes);
app.use("/auth", authRoutes);

// This MUST be the last app.use() - after all routes
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// --- start ---
app.listen(PORT, () => {
  console.log(`Server running on http//localhost:${String(PORT)}`);
});
